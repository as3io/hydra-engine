const Promise = require('bluebird');
const Model = require('../models/project');
const OrganizationRepo = require('./organization');
const fixtures = require('../fixtures');

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
   * @param {string} payload.description
   * @return {Promise}
   */
  async update(id, { name, description } = {}) {
    if (!id) throw new Error('Unable to update project: no ID was provided.');
    const project = await this.findById(id);
    if (!project) throw new Error(`Unable to update project: no record was found for ID '${id}'`);
    project.set({ name, description });
    return project.save();
  },

  /**
   * Find an Model record by ID.
   *
   * Will return a rejected promise if no ID was provided.
   * Will NOT reject the promise if the record cannot be found.
   *
   * @param {string} id
   * @return {Promise}
   */
  async findById(id) {
    if (!id) throw new Error('Unable to find project: no ID was provided.');
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
