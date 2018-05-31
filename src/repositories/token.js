const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');
const Token = require('../models/token');

const { JWT_SECRET } = process.env;

module.exports = {
  /**
   * Creates an encoded JWT for the provided payload.
   * If the `jti` and `iat` values are not present, they will automatically be added.
   *
   * If an `exp` values is provided in the payload, it will override the `ttl` argument.
   *
   * @async
   * @param {object} payload The JWT payload object.
   * @param {number} ttl The token TTL, in seconds
   */
  async create(payload = {}, ttl) {
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
    await Token.create({ payload: toSign });
    return token;
  },

  /**
   * Verifies the provided token.
   *
   * @async
   * @param {string} encoded The encoded JWT value.
   */
  async verify(encoded) {
    if (!encoded) throw new Error('Unable to verify token: no value was provided.');
    const verified = jwt.verify(encoded, JWT_SECRET, { algorithms: ['HS256'] });

    const token = await Token.findOne({ 'payload.jti': verified.jti });
    if (!token) throw new Error('The provided token is no longer valid. Was it already used?');
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
