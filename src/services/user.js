const bcrypt = require('bcrypt');
const User = require('../models/user');
const sessionService = require('../services/session');
const tokenGenerator = require('../services/token-generator');
const mailer = require('../services/mailer');

const UserService = () => ({
  /**
   * Logs in a user via their email+password credentials.
   *
   * @param {string} email The user's email address.
   * @param {string} password The user's (cleartext) password.
   */
  async login(email, password) {
    // @todo Should login be prevented if email is not verified?
    if (!password) throw new Error('Unable to login user. No password was provided.');

    // Load user from database.
    const user = await User.findByEmail(email);
    if (!user) throw new Error('No user was found for the provided email address.');

    if (!user.get('password')) {
      await this.sendMagicLoginEmail(email);
      throw new Error('A password has not yet been set. An email has been sent providing further instructions.');
    }

    // Verify password.
    await this.verifyPassword(password, user.get('password'));

    // Create session.
    const session = await sessionService.set(user.id);

    // Update login info
    await this.updateLoginInfo(user);
    return { user, session };
  },

  /**
   * Logs in a user via their API crendentials.
   *
   * @param {string} key The user's API key.
   * @param {string} secret The user's API secret.
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
   * Logs in a user via a "magic login" token.
   *
   * @param {string} jwt The magic login JWT.
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

  /**
   * Creates a "magic login" JWT for the provided user.
   *
   * @param {User} user The user document.
   */
  createMagicLoginToken(user) {
    return tokenGenerator.create('magic-login', {
      uid: user.id,
    }, 60 * 60);
  },

  /**
   * Sends the "magic login" email to a user.
   * If the user is not found, the method will still return `true` in order to
   * mask which users exist.
   *
   * @param {string} email The user's email address.
   */
  async sendMagicLoginEmail(email) {
    const user = await User.findByEmail(email);
    if (!user) return true;

    const token = await this.createMagicLoginToken(user);
    await mailer.sendMagicLogin(user, token);
    return true;
  },

  /**
   * Resets a user's password if the provided password reset JWT is valid.
   *
   * @param {string} jwt The reset password JWT.
   * @param {string} password The new, cleartext password.
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
   * Sends the welcome/verification email for a new user.
   *
   * @param {User} user The user document.
   */
  async sendWelcomeVerification(user) {
    const token = await this.createMagicLoginToken(user);
    return mailer.sendWelcomeVerification(user, token);
  },

  /**
   * Sends the "reset password" email to a user.
   * If the user is not found, the method will still return `true` in order to
   * mask which users exist.
   *
   * @param {string} email The user's email address.
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
   * @param {string} id The session ID.
   * @param {string} uid The user ID.
   */
  deleteSession(id, uid) {
    return sessionService.delete(id, uid);
  },

  /**
   * Checks that the provided API credentials are still valid.
   *
   * @param {object} credentials The API credentials (key and secret).
   * @param {User} user The user document
   */
  checkApiCredentials(credentials, user) {
    if (credentials.key !== user.get('api.key')) throw new Error('The provided API key is no longer valid.');
    if (credentials.secret && credentials.secret !== user.get('api.secret')) {
      throw new Error('The provided API secret is no longer valid.');
    }
    return true;
  },

  /**
   * Verifies a cleartext password against its encoded counterpart.
   *
   * @param {string} clear The cleartext password
   * @param {string} encoded The encoded/encrypted password.
   */
  async verifyPassword(clear, encoded) {
    const valid = await bcrypt.compare(clear, encoded);
    if (!valid) throw new Error('The provided password was incorrect.');
    return valid;
  },

  /**
   * Updates a user's login info.
   *
   * @param {User} user
   */
  updateLoginInfo(user) {
    user.set('logins', user.get('logins') + 1);
    user.set('lastLoggedInAt', new Date());
    return user.save();
  },
});

module.exports = UserService();
