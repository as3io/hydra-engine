const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Repo = require('../../repositories/project');
const Model = require('../../models/project');
const Organization = require('../../models/organization');

module.exports = {
  /**
   *
   */
  Project: {
    organization: ({ organizationId }) => Organization.findById(organizationId),
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
    allProjects: (root, { criteria, pagination, sort }, { auth }) => {
      auth.check();
      return Repo.paginate({ criteria, pagination, sort });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createProject: async (root, { input }, { auth }) => {
      await auth.checkOrgWrite();
      const { payload } = input;
      payload.organization = auth.tenant.organizationId;
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

    /**
     *
     */
    configureProject: async (root, { input }, { auth }) => {
      auth.check();
      const model = await Model.findById(input.projectId);
      const { name, description } = input;
      model.set('name', name);
      model.set('description', description);
      return model.save();
    },
  },
};
