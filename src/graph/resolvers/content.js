const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const ContentRepo = require('../../repositories/content');

module.exports = {
  /**
   *
   */
  ContentConnection: paginationResolvers.connection,

  /**
   *
   */
  ContentEdge: paginationResolvers.edge,

  /**
   *
   */
  Query: {
    /**
     *
     */
    content: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await ContentRepo.findById(id);
      if (!record) throw new Error(`No content record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allContent: (root, { criteria, pagination, sort }, { auth }) => {
      auth.check();
      return ContentRepo.paginate({ criteria, pagination, sort });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createContent: (root, { input }, { auth }) => {
      auth.check();
      const { project, payload } = input;
      payload.project = project;
      return ContentRepo.create(payload);
    },

    /**
     *
     */
    updateContent: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return ContentRepo.update(id, payload);
    },
  },
};
