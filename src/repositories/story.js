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
   * @param {string} id
   * @return {Promise}
   */
  async removeById(id) {
    if (!id) throw new Error('Unable to remove story: no ID was provided.');
    return this.remove({ _id: id });
  },
};
