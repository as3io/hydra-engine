const Promise = require('bluebird');
const Model = require('../models/organization');
const OrganizationMember = require('../models/organization-member');
const TokenRepo = require('./token');
const UserRepo = require('./user');
const mailer = require('../services/mailer');

module.exports = {
  /**
   *
   * @param {object} payload
   * @return {Promise}
   */
  create(payload = {}) {
    const organization = new Model(payload);
    return organization.save();
  },

  /**
   *
   * @param {string} id
   * @param {object} payload
   * @param {string} payload.name
   * @return {Promise}
   */
  async update(id, { name, description, photoURL } = {}) {
    if (!id) throw new Error('Unable to update organization: no ID was provided.');
    const org = await this.findById(id);
    if (!org) throw new Error(`Unable to update organization: no record was found for ID '${id}'`);
    org.set({ name, description, photoURL });
    return org.save();
  },

  /**
   * Find an Model record by ID.
   *
   * Will return a rejected promise if no ID was provided.
   * Will NOT reject the promise if the record cannnot be found.
   *
   * @param {string} id
   * @return {Promise}
   */
  async findById(id) {
    if (!id) throw new Error('Unable to find organization: no ID was provided.');
    return Model.findOne({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  find(criteria) {
    return Model.find(criteria);
  },

  /**
   * @param {string} id
   * @return {Promise}
   */
  removeById(id) {
    if (!id) return Promise.reject(new Error('Unable to remove organization: no ID was provided.'));
    return this.remove({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  remove(criteria) {
    return Model.remove(criteria);
  },

  /**
   *
   */
  async inviteUserToOrg(organization, {
    email,
    givenName,
    familyName,
    role,
    projectRoles,
  } = {}) {
    let user = await UserRepo.findByEmail(email);
    if (!user) {
      user = await UserRepo.create({ email, givenName, familyName });
      await user.save();
    }

    const userId = user.id;
    const organizationId = organization.id;

    await OrganizationMember.remove({ userId, organizationId });

    const orgMember = await OrganizationMember.create({
      organizationId,
      userId,
      projectRoles: projectRoles || [],
      role,
    });

    const token = await TokenRepo.create('user-org-invitation', {
      uid: userId,
      oid: organizationId,
    }, 60 * 60 * 24 * 30);

    // send welcome/invite email
    await mailer.sendOrganizationInvitation(organization, user, token);

    return orgMember;
  },

  async acknowledgeUserInvite(jwt) {
    const token = await TokenRepo.verify('user-org-invitation', jwt);
    const userId = token.payload.uid;
    const organizationId = token.payload.oid;
    const orgMember = await OrganizationMember.findOne({ userId, organizationId });
    if (!orgMember) throw new Error('No organization membership was found for the provided token.');
    orgMember.acceptedAt = new Date();
    await orgMember.save();
    await TokenRepo.invalidate(token.id);
    return orgMember;
  },
};
