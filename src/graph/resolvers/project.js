const Repo = require('../../repositories/project');
const Model = require('../../models/project');
const Organization = require('../../models/organization');
const Key = require('../../models/key');
const paginationResolvers = require('./pagination');

module.exports = {
  /**
   *
   */
  Project: {
    organization: ({ organization }) => Organization.findById(organization),
    keys: ({ id }) => Key.find({ project: id }),
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
