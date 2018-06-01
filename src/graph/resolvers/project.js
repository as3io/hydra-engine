const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Repo = require('../../repositories/project');
const OrgMemberRepo = require('../../repositories/organization-member');
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
      const { organizationId } = auth.tenant;
      const member = await OrgMemberRepo.isProjectMember(auth.user.id, organizationId, id);
      if (!member) throw new Error('You do not have permission to read this project.');

      const record = await Repo.findById(id);
      if (!record) throw new Error(`No project record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allProjects: async (root, { pagination, sort }, { auth }) => {
      auth.check();
      const { organizationId } = auth.tenant;
      const projectIds = await OrgMemberRepo.getUserProjectIds(auth.user.id, organizationId);
      const criteria = { _id: { $in: projectIds } };
      return Repo.paginate({ pagination, sort, criteria });
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
      payload.organizationId = auth.tenant.organizationId;
      return Repo.create(payload);
    },

    /**
     *
     */
    updateProject: async (root, { input }, { auth }) => {
      await auth.checkProjectWrite();
      const model = await Model.findById(input.projectId);
      const { name, description } = input;
      model.set({ name, description });
      return model.save();
    },
  },
};
