const StoryRepo = require('../../repositories/story');

module.exports = {
  /**
   *
   */
  Query: {
    /**
     *
     */
    story: async (root, { input }, { auth }) => {
      await auth.checkProjectRead();
      const { id } = input;
      const { projectId } = auth.tenant;
      const story = await StoryRepo.find({ _id: id, projectId });
      if (!story) throw new Error(`No story record found for ID ${id}.`);
      return story;
    },
  },
};
