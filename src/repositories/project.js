const Promise = require('bluebird');
const Model = require('../models/project');

module.exports = {
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
};
