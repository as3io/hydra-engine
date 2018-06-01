const { Pagination } = require('@limit0/mongoose-graphql-pagination');
const Promise = require('bluebird');
const Story = require('../models/story');
const fixtures = require('../fixtures');
const ProjectRepo = require('./project');

module.exports = {
  /**
   *
   * @param {object} payload
   * @return {Promise}
   */
  create(payload = {}) {
    const story = new Story(payload);
    return story.save();
  },

  /**
   *
   * @param {string} id
   * @param {string} projectId
   * @param {object} payload
   * @return {Promise}
   */
  async update(id, projectId, {
    title,
    teaser,
    slug,
    body,
    published,
  } = {}) {
    if (!id) throw new Error('Unable to update story: no ID was provided.');
    const story = await this.findOne({ _id: id, projectId });
    if (!story) throw new Error(`Unable to update story: no story was found in project for ID "${id}"`);
    story.set({
      title,
      teaser,
      slug,
      body,
      published,
    });
    return story.save();
  },

  /**
   * Find an Story record by ID.
   *
   * Will return a rejected promise if no ID was provided.
   * Will NOT reject the promise if the record cannnot be found.
   *
   * @param {string} id
   * @return {Promise}
   */
  async findById(id) {
    if (!id) throw new Error('Unable to find story: no ID was provided.');
    return Story.findOne({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  find(criteria) {
    return Story.find(criteria);
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  findOne(criteria) {
    return Story.findOne(criteria);
  },

  /**
   * @param {string} id
   * @return {Promise}
   */
  async removeById(id) {
    if (!id) throw new Error('Unable to remove story: no ID was provided.');
    return this.remove({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  remove(criteria) {
    return Story.remove(criteria);
  },

  /**
   * Paginates all Story models.
   *
   * @param {object} params
   * @param {object.object} params.pagination The pagination parameters.
   * @param {object.object} params.sort The sort parameters.
   * @return {Pagination}
   */
  paginate({ criteria, pagination, sort } = {}) {
    return new Pagination(Story, { criteria, pagination, sort });
  },

  /**
   *
   * @param {number} [count=1]
   * @return {object}
   */
  generate(count = 1, params) {
    return fixtures(Story, count, params);
  },

  async seed({ count = 1, projectCount = 1 } = {}) {
    const projects = await ProjectRepo.seed({ count: projectCount });
    const results = this.generate(count, {
      projectId: () => projects.random().id,
    });
    await Promise.all(results.all().map(model => model.save()));
    return results;
  },
};
