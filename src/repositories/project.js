const Promise = require('bluebird');
const Model = require('../models/project');
const OrganizationRepo = require('./organization');
const Pagination = require('../classes/pagination');
const fixtures = require('../fixtures');
const TypeAhead = require('../classes/type-ahead');

module.exports = {
  /**
   *
   * @param {object} payload
   * @return {Promise}
   */
  create(payload = {}) {
    const project = new Model(payload);
    return project.save();
  },

  /**
   *
   * @param {string} id
   * @param {object} payload
   * @param {string} payload.name
   * @return {Promise}
   */
  update(id, { name, organization } = {}) {
    if (!id) return Promise.reject(new Error('Unable to update project: no ID was provided.'));
    const criteria = { _id: id };
    const update = { $set: { name } };
    if (organization) {
      update.$set.organization = organization;
    }
    const options = { new: true, runValidators: true };
    return Model.findOneAndUpdate(criteria, update, options).then((document) => {
      if (!document) throw new Error(`Unable to update project: no record was found for ID '${id}'`);
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
    if (!id) return Promise.reject(new Error('Unable to find project: no ID was provided.'));
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
    if (!id) return Promise.reject(new Error('Unable to remove project: no ID was provided.'));
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
    const { typeahead } = search;
    const { criteria, sort } = TypeAhead.getCriteria(typeahead);
    return new Pagination(Model, { criteria, pagination, sort });
  },

  /**
   *
   * @param {number} [count=1]
   * @return {object}
   */
  generate(count = 1, params) {
    return fixtures(Model, count, params);
  },

  async seed({ count = 1, organizationCount = 1 } = {}) {
    const organizations = await OrganizationRepo.seed({ count: organizationCount });
    const results = this.generate(count, {
      organizationId: () => organizations.random().id,
    });
    await Promise.all(results.all().map(model => model.save()));
    return results;
  },

};
