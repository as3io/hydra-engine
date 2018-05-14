const { Pagination, TypeAhead } = require('@limit0/mongoose-graphql-pagination');
const Promise = require('bluebird');
const Content = require('../models/content');
const fixtures = require('../fixtures');
const ProjectRepo = require('./project');

module.exports = {
  /**
   *
   * @param {object} payload
   * @return {Promise}
   */
  create(payload = {}) {
    const content = new Content(payload);
    return content.save();
  },

  /**
   *
   * @param {string} id
   * @param {object} payload
   * @param {string} payload.name
   * @return {Promise}
   */
  async update(id, {
    title,
    teaser,
    slug,
    text,
    published,
  } = {}) {
    if (!id) return Promise.reject(new Error('Unable to update content: no ID was provided.'));
    const content = await this.findById(id);
    if (!content) return Promise.reject(new Error(`Unable to update content: no content was found for ID "${id}"`));
    if (title) content.title = title;
    if (teaser) content.teaser = teaser;
    if (slug) content.slug = slug;
    if (text) content.text = text;
    if (published) content.published = published;
    return content.save();
  },

  /**
   * Find an Content record by ID.
   *
   * Will return a rejected promise if no ID was provided.
   * Will NOT reject the promise if the record cannnot be found.
   *
   * @param {string} id
   * @return {Promise}
   */
  findById(id) {
    if (!id) return Promise.reject(new Error('Unable to find content: no ID was provided.'));
    return Content.findOne({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  find(criteria) {
    return Content.find(criteria);
  },

  /**
   * @param {string} id
   * @return {Promise}
   */
  removeById(id) {
    if (!id) return Promise.reject(new Error('Unable to remove content: no ID was provided.'));
    return this.remove({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  remove(criteria) {
    return Content.remove(criteria);
  },

  /**
   * Paginates all Content models.
   *
   * @param {object} params
   * @param {object.object} params.pagination The pagination parameters.
   * @param {object.object} params.sort The sort parameters.
   * @return {Pagination}
   */
  paginate({ criteria, pagination, sort } = {}) {
    return new Pagination(Content, { criteria, pagination, sort });
  },

  /**
   * Searches & Paginates all Content models.
   *
   * @param {object} params
   * @param {object.object} params.pagination The pagination parameters.
   * @param {object.object} params.search The search parameters.
   * @return {Pagination}
   */
  search({ criteria, pagination, search } = {}) {
    const { field, term } = search.typeahead;
    const typeahead = new TypeAhead(field, term);
    return typeahead.paginate(Content, { criteria, pagination });
  },

  /**
   *
   * @param {number} [count=1]
   * @return {object}
   */
  generate(count = 1, params) {
    return fixtures(Content, count, params);
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
