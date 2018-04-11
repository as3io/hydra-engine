const Repo = require('../../repositories/project');
const Organization = require('../../models/organization');
const paginationResolvers = require('./pagination');

module.exports = {
  /**
   *
   */
  Project: {
    organization: ({ organization }) => Organization.findById(organization),
  },
  /**
   *
   */
  ProjectConnection: paginationResolvers.connection,

  /**
   *
   */
  ProjectEdge: paginationResolvers.edge,

  /**
   *
   */
  Query: {
    /**
     *
     */
    project: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await Repo.findById(id);
      if (!record) throw new Error(`No project record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allProjects: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return Repo.paginate({ pagination, sort });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createProject: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      return Repo.create(payload);
    },

    /**
     *
     */
    updateProject: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return Repo.update(id, payload);
    },
  },
};
