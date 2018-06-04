const Story = require('../models/story');

module.exports = {
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
    if (!projectId) throw new Error('Unable to update story: no project ID was provided.');
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
};
