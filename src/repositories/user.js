const bcrypt = require('bcrypt');
const Promise = require('bluebird');
const sessionRepo = require('./session');
const User = require('../models/user');
const Organization = require('../models/organization');
const fixtures = require('../fixtures');
const mailer = require('../connections/sendgrid');
const uuid = require('uuid/v4');
const { Pagination } = require('@limit0/mongoose-graphql-pagination');

module.exports = {
  async create(payload = {}) {
    const user = new User(payload);
    await user.save();
    await mailer.sendWelcomeVerification(user);
    return user;
  },

  generate(count = 1) {
    return fixtures(User, count);
  },

  /**
   *
   * @param {string} email
   * @return {Promise}
   */
  findByEmail(email) {
    const value = this.normalizeEmail(email);
    if (!value) return Promise.reject(new Error('Unable to find user: no email address was provided.'));
    return User.findOne({ email: value });
  },

  /**
   *
   * @param {string} token
   * @return {Promise}
   */
  findByToken(token) {
    return User.findOne({ token });
  },

  normalizeEmail(email) {
    if (!email) return '';
    return String(email).trim().toLowerCase();
  },

  /**
   *
   * @param {string} id
   * @return {Promise}
   */
  findById(id) {
    if (!id) return Promise.reject(new Error('Unable to find user: no ID was provided.'));
    return User.findOne({ _id: id });
  },

  removeByEmail(email) {
    const value = this.normalizeEmail(email);
    if (!value) return Promise.reject(new Error('Unable to remove user: no email address was provided.'));
    return this.remove({ email: value });
  },

  remove(criteria) {
    return User.remove(criteria);
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
    const user = await this.findByEmail(email);
    if (!user) throw new Error('No user was found for the provided email address.');

    if (!user.get('password')) throw new Error('A password has not yet been set. An email has been sent providing further instructions.');

    // Verify password.
    await this.verifyPassword(password, user.get('password'));

    // Create session.
    const session = await sessionRepo.set({ uid: user.id });

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
    const session = await sessionRepo.set({ uid: user.id });
    return { user, session };
  },

  /**
   *
   * @param {string} token
   * @return {Promise}
   */
  async loginFromToken(token) {
    const user = await this.findByToken(token);
    if (!user) throw new Error('No user was found for the provided token.');
    user.set('token', null);
    user.set('emailVerified', true);

    // Create session.
    const session = await sessionRepo.set({ uid: user.id });

    // Update login info
    await this.updateLoginInfo(user);
    return { user, session };
  },

  /**
   *
   * @param {string} email
   */
  async magicLogin(email) {
    const user = await this.findByEmail(email);
    if (!user) throw new Error('No user was found for the provided email address.');
    // @todo JWT
    user.set('token', uuid());
    await user.save();
    await mailer.sendMagicLogin(user);
    return user;
  },

  /**
   *
   * @param {string} _id
   * @param {string} password
   * @return {Promise}
   */
  async setPassword(id, password) {
    const user = await this.findById(id);
    if (!user) throw new Error('No user was found for the provided token.');
    user.set('password', password);
    return user.save();
  },

  /**
   *
   */
  async sendPasswordReset(email) {
    const user = await this.findByEmail(email);
    if (!user) throw new Error('No user was found for the provided email address.');
    // @todo JWT
    user.set('token', uuid());
    await user.save();
    await mailer.sendPasswordReset(user);
    return user;
  },

  async retrieveSession(token) {
    const session = await sessionRepo.get(token);
    // Ensure user still exists/refresh the user data.
    const user = await this.findById(session.uid);
    if (!user) throw new Error('Unable to retrieve session: the provided user could not be found.');
    return { user, session };
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

  /**
   * Paginates all User models.
   *
   * @param {object} params
   * @param {object.object} params.pagination The pagination parameters.
   * @param {object.object} params.sort The sort parameters.
   * @return {Pagination}
   */
  paginate({ pagination, sort } = {}) {
    return new Pagination(User, { pagination, sort });
  },

  async seed({ count = 1 } = {}) {
    const results = this.generate(count);
    await Promise.all(results.all().map(model => model.save()));
    return results;
  },

  /**
   *
   */
  async organizationInvite(id, {
    email,
    givenName,
    familyName,
    role,
    projectRoles,
  }) {
    const organization = await Organization.findById(id);
    if (!organization) throw new Error(`Unable to invite user: Organization with id "${id}" was not found.`);

    let user = await this.findByEmail(email);
    if (!user) user = await this.create({ email, givenName, familyName }, false);
    user.set('token', uuid());
    await user.save();

    const projects = [];
    projectRoles.forEach((pRole) => {
      if (pRole && pRole.id && pRole.role) {
        projects.push(Object.assign({}, { project: pRole.id, role: pRole.role }));
      }
    });

    let found = false;
    const payload = { user: user.id, role, projects };

    organization.members.forEach((membership) => {
      if (membership.user == user.id) { // eslint-disable-line eqeqeq
        found = true;
        let member = organization.members.id(membership.id); // eslint-disable-line no-unused-vars
        member = payload;
      }
    });
    if (!found) organization.members.addToSet(payload);
    await organization.save();

    // send welcome/invite email
    await mailer.sendOrganizationInvitation(organization, user);
  },
};
