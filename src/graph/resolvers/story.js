const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const StoryRepo = require('../../repositories/story');

module.exports = {
  /**
   *
   */
  StoryConnection: paginationResolvers.connection,

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
      const story = await StoryRepo.findOne({ _id: id, projectId });
      if (!story) throw new Error(`No story record found for ID ${id}.`);
      return story;
    },

    /**
     *
     */
    allStories: async (root, { pagination, sort }, { auth }) => {
      await auth.checkProjectRead();
      const { projectId } = auth.tenant;
      const criteria = { projectId };
      return StoryRepo.paginate({ criteria, pagination, sort });
    },

    /**
     *
     */
    allPublishedStories: async (root, { pagination, sort }, { auth }) => {
      await auth.checkProjectRead();
      const { projectId } = auth.tenant;
      const criteria = { published: true, projectId };
      return StoryRepo.paginate({ criteria, pagination, sort });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createStory: async (root, { input }, { auth }) => {
      await auth.checkProjectWrite();
      const { projectId } = auth.tenant;
      const { payload } = input;
      return StoryRepo.create({ ...payload, projectId });
    },

    /**
     *
     */
    updateStory: async (root, { input }, { auth }) => {
      await auth.checkProjectWrite();
      const { projectId } = auth.tenant;
      const { id, payload } = input;
      return StoryRepo.update(id, projectId, payload);
    },
  },
};
