const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { isUUID } = require('validator');
const uuid = require('../utils/wrap-uuid');
const redis = require('../connections/redis');

const prototype = {
  /**
   * @async
   * @param {string} id The session ID.
   * @param {string} uid The user ID.
   */
  async delete(id, uid) {
    if (!id || !uid) throw new Error('Unable to delete session: both a session and user ID are required.');
    const delSession = redis.delAsync(this.prefixSessionId(id));
    const removeId = redis.sremAsync(this.prefixUserId(uid), id);
    return Promise.join(delSession, removeId);
  },

  /**
   * @async
   * @param {string} token The session JWT token.
   */
  async get(token) {
    if (!token) throw new Error('Unable to get session: no token was provided.');
    const parsed = await jwt.decode(token, { complete: true, force: true });
    if (!parsed) throw new Error('Unable to get session: invalid token format.');
    const result = await redis.getAsync(this.prefixSessionId(parsed.payload.jti));

    if (!result) throw new Error('Unable to get session: no token found in storage.');

    const session = Object(JSON.parse(result));
    const {
      uid,
      ts,
      s,
      api,
    } = session;

    const sid = this.createSessionId(uid, ts);
    const secret = this.createSecret(s);
    const verified = jwt.verify(token, secret, { jwtid: sid, algorithms: ['HS256'] });

    // Return the public session.
    return {
      id: sid,
      uid: session.uid,
      cre: verified.iat,
      exp: verified.exp,
      api,
      token,
    };
  },

  /**
   * @async
   * @param {string} uid The user ID.
   * @param {?object} api Optional API key/secret (if using the API)
   */
  async set(uid, api) {
    if (!uid) throw new Error('Unable to set session: no user ID was provided.');

    const now = new Date();
    const iat = Math.floor(now.valueOf() / 1000);

    const userSecret = await bcrypt.hash(uuid.v4(), 5);

    const ts = now.valueOf();
    const sid = this.createSessionId(uid, ts);
    const exp = iat + Number(this.expires);
    const secret = this.createSecret(userSecret);
    const token = jwt.sign({ jti: sid, exp, iat }, secret);

    await redis.setexAsync(this.prefixSessionId(sid), this.expires, JSON.stringify({
      id: sid,
      ts,
      uid,
      s: userSecret,
      api,
    }));

    const memberKey = this.prefixUserId(uid);
    const addUserId = redis.saddAsync(memberKey, sid);
    const updateExpires = redis.expireAsync(memberKey, this.expires);
    await Promise.join(addUserId, updateExpires);

    // Return the public session.
    return {
      id: sid,
      uid,
      cre: iat,
      exp,
      token,
      api,
    };
  },

  /**
   * @private
   * @param {string} uid
   * @param {number} timestamp
   */
  createSessionId(uid, timestamp) {
    return uuid.v5(`${uid}.${timestamp}`, this.namespace);
  },

  /**
   * @private
   * @param {string} userSecret
   */
  createSecret(userSecret) {
    return `${userSecret}.${this.globalSecret}`;
  },

  /**
   * @private
   * @param {string} id
   */
  prefixSessionId(id) {
    return `session:id:${id}`;
  },

  /**
   * @private
   * @param {string} uid
   */
  prefixUserId(uid) {
    return `session:uid:${uid}`;
  },
};

const { create, assign } = Object;

module.exports = ({ globalSecret, namespace, expires } = {}) => {
  const prefix = 'Unable to initialize the session';
  if (!globalSecret) throw new Error(`${prefix}: no value was provided for the global secret.`);
  if (!isUUID(String(namespace))) throw new Error(`${prefix}: an invalid value was provided for the namespace.`);
  if (!expires) throw new Error(`${prefix}: no value was provided for the session expiration.`);
  const obj = create(prototype);
  return assign(obj, { globalSecret, namespace, expires });
};
