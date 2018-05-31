const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');
const Token = require('../models/token');

const { JWT_SECRET } = process.env;

module.exports = {
  /**
   * Creates an encoded JWT for the provided payload.
   * If the `jti` and `iat` values are not present in the payload, they will automatically be added.
   *
   * If an `exp` values is provided in the payload, it will override the `ttl` argument.
   *
   * @async
   * @param {string} action The action the token is for.
   * @param {object} payload The JWT payload object.
   * @param {number} ttl The token TTL, in seconds
   */
  async create(action, payload = {}, ttl) {
    const now = new Date();
    const iat = Math.floor(now.valueOf() / 1000);

    const exp = ttl ? iat + ttl : undefined;

    const toSign = {
      jti: uuid(),
      iat,
      exp,
      ...payload,
    };
    const token = jwt.sign(toSign, JWT_SECRET);
    await Token.create({ action, payload: toSign });
    return token;
  },

  /**
   * Verifies the provided token.
   *
   * @async
   * @param {string} action The corresponding action for the token.
   * @param {string} encoded The encoded JWT value.
   */
  async verify(action, encoded) {
    if (!action) throw new Error('Unable to verify token: no action was provided.');
    if (!encoded) throw new Error('Unable to verify token: no value was provided.');
    const verified = jwt.verify(encoded, JWT_SECRET, { algorithms: ['HS256'] });

    const token = await Token.findOne({ 'payload.jti': verified.jti, action });
    if (!token) throw new Error('The provided token was either not found or is no longer valid.');
    return token;
  },

  /**
   * Invalidates the token by removing it from the database.
   *
   * @async
   * @param {string} id
   */
  invalidate(id) {
    return Token.remove({ _id: id });
  },
};
