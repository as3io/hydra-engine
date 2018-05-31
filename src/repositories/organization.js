const Promise = require('bluebird');
const Model = require('../models/organization');
const OrganizationMember = require('../models/organization-member');
const TokenRepo = require('./token');
const fixtures = require('../fixtures');
const UserRepo = require('./user');
const mailer = require('../services/mailer');
const { Pagination, TypeAhead } = require('@limit0/mongoose-graphql-pagination');

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
  update(id, { name } = {}) {
    if (!id) return Promise.reject(new Error('Unable to update organization: no ID was provided.'));
    const criteria = { _id: id };
    const update = { $set: { name } };
    const options = { new: true, runValidators: true };
    return Model.findOneAndUpdate(criteria, update, options).then((document) => {
      if (!document) throw new Error(`Unable to update organization: no record was found for ID '${id}'`);
      return document;
    });
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
  findById(id) {
    if (!id) return Promise.reject(new Error('Unable to find organization: no ID was provided.'));
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
   * Paginates all Model models.
   *
   * @param {object} params
   * @param {object.object} params.pagination The pagination parameters.
   * @param {object.object} params.sort The sort parameters.
   * @return {Pagination}
   */
  paginate({ criteria, pagination, sort } = {}) {
    return new Pagination(Model, { criteria, pagination, sort });
  },

  /**
   * Searches & Paginates all Model models.
   *
   * @param {object} params
   * @param {object.object} params.pagination The pagination parameters.
   * @param {object.object} params.search The search parameters.
   * @return {Pagination}
   */
  search({ pagination, search } = {}) {
    const { field, term } = search.typeahead;
    const typeahead = new TypeAhead(field, term);
    return typeahead.paginate(Model, { pagination });
  },

  /**
   *
   * @param {number} [count=1]
   * @return {object}
   */
  generate(count = 1) {
    return fixtures(Model, count);
  },

  async seed({ count = 1 } = {}) {
    const results = this.generate(count);
    await Promise.all(results.all().map(model => model.save()));
    return results;
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

    const token = await TokenRepo.create({
      act: 'inviteUserToOrg',
      uid: userId,
      oid: organizationId,
    }, 60 * 60 * 24 * 30);

    // send welcome/invite email
    await mailer.sendOrganizationInvitation(organization, user, token);

    return orgMember;
  },
};
