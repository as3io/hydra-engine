const bcrypt = require('bcrypt');
const sessionService = require('../services/session');
const User = require('../models/user');
const tokenGenerator = require('../services/token-generator');
const mailer = require('../services/mailer');

module.exports = {
  async sendWelcomeVerification(user) {
    const token = await this.createMagicLoginToken(user);
    return mailer.sendWelcomeVerification(user, token);
  },

  /**
   *
   * @param {string} email
   * @param {string} password
   * @return {Promise}
   */
  async login(email, password) {
    // @todo Need to determine whether email address is verified!
    // Or does that get handled elsewhere?
    if (!password) throw new Error('Unable to login user. No password was provided.');

    // Load user from database.
    const user = await User.findByEmail(email);
    if (!user) throw new Error('No user was found for the provided email address.');

    if (!user.get('password')) throw new Error('A password has not yet been set. An email has been sent providing further instructions.');

    // Verify password.
    await this.verifyPassword(password, user.get('password'));

    // Create session.
    const session = await sessionService.set(user.id);

    // Update login info
    await this.updateLoginInfo(user);
    return { user, session };
  },

  /**
   *
   * @param {string} key
   * @param {string} secret
   * @return {Promise}
   */
  async loginWithApiKey(key, secret) {
    const user = await User.findOne({ 'api.key': key });
    if (!user) throw new Error('No user was found for the provided API key.');
    if (secret && secret !== user.get('api.secret')) throw new Error('The provided API secret is invalid.');

    // Create session.
    const session = await sessionService.set(user.id, { key, secret });
    return { user, session };
  },

  /**
   *
   * @param {string} jwt
   * @return {Promise}
   */
  async loginWithMagicToken(jwt) {
    const token = await tokenGenerator.verify('magic-login', jwt);
    const userId = token.payload.uid;
    const user = await User.findById(userId);
    if (!user) throw new Error('No user was found for the provided token.');

    // Create session.
    const session = await sessionService.set(user.id);
    await tokenGenerator.invalidate(token.id);

    // Update login info
    user.emailVerified = true;
    await this.updateLoginInfo(user);
    return { user, session };
  },

  createMagicLoginToken(user) {
    return tokenGenerator.create('magic-login', {
      uid: user.id,
    }, 60 * 60);
  },

  /**
   *
   * @param {string} email
   */
  async sendMagicLoginEmail(email) {
    const user = await User.findByEmail(email);
    if (!user) return true;

    const token = await this.createMagicLoginToken(user);
    await mailer.sendMagicLogin(user, token);
    return true;
  },

  /**
   *
   * @param {string} jwt
   * @param {string} password
   * @return {Promise}
   */
  async resetPassword(jwt, password) {
    const token = await tokenGenerator.verify('password-reset', jwt);
    const userId = token.payload.uid;

    const user = await User.findById(userId);
    if (!user) throw new Error('No user was found for the provided token.');
    user.set('password', password);
    await user.save();
    await tokenGenerator.invalidate(token.id);
    return user;
  },

  /**
   *
   * @param {string} id
   * @param {string} password
   * @return {Promise}
   */
  async setCurrentUserPassword(id, password) {
    const user = await User.findById(id);
    if (!user) throw new Error('No user was found!');
    user.set('password', password);
    return user.save();
  },

  /**
   *
   */
  async sendPasswordResetEmail(email) {
    const user = await User.findByEmail(email);
    if (!user) return true;

    const token = await tokenGenerator.create('password-reset', {
      uid: user.id,
    }, 60 * 60);

    await mailer.sendPasswordReset(user, token);
    return true;
  },

  /**
   * Retrieves a user session for the provided JWT token.
   *
   * @async
   * @param {string} token The JWT.
   */
  async retrieveSession(token) {
    const session = await sessionService.get(token);
    // Ensure user still exists/refresh the user data.
    const user = await User.findById(session.uid);
    if (!user) throw new Error('Unable to retrieve session: the provided user could not be found.');
    if (session.api) this.checkApiCredentials(session.api, user);
    return { user, session };
  },

  /**
   * Deletes a user session.
   *
   * @async
   * @param {string} id The session ID.
   * @param {string} uid The user ID.
   */
  deleteSession(id, uid) {
    return sessionService.delete(id, uid);
  },

  /**
   *
   */
  checkApiCredentials(credentials, user) {
    if (credentials.key !== user.get('api.key')) throw new Error('The provided API key is no longer valid.');
    if (credentials.secret && credentials.secret !== user.get('api.secret')) {
      throw new Error('The provided API secret is no longer valid.');
    }
  },

  /**
   *
   * @param {string} clear
   * @param {string} encoded
   * @return {Promise}
   */
  async verifyPassword(clear, encoded) {
    const valid = await bcrypt.compare(clear, encoded);
    if (!valid) throw new Error('The provided password was incorrect.');
    return valid;
  },

  /**
   *
   * @param {User} user
   * @return {Promise}
   */
  updateLoginInfo(user) {
    user.set('logins', user.get('logins') + 1);
    user.set('lastLoggedInAt', new Date());
    return user.save();
  },
};
