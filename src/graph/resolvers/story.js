const StoryRepo = require('../../repositories/story');
const paginationResolvers = require('./pagination');

module.exports = {
  /**
   *
   */
  StoryConnection: paginationResolvers.connection,

  /**
   *
   */
  StoryEdge: paginationResolvers.edge,

  /**
   *
   */
  Query: {
    /**
     *
     */
    story: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await StoryRepo.findById(id);
      if (!record) throw new Error(`No story record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allStories: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return StoryRepo.paginate({ pagination, sort });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createStory: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      return StoryRepo.create(payload);
    },

    /**
     *
     */
    updateStory: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return StoryRepo.update(id, payload);
    },
  },
};
