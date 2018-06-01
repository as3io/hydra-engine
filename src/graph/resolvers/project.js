const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Repo = require('../../repositories/project');
const Model = require('../../models/project');
const Organization = require('../../models/organization');
const OrganizationMember = require('../../models/organization-member');

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
    allProjects: async (root, { pagination, sort }, { auth }) => {
      await auth.checkOrgRead();
      const userId = auth.user.id;
      const { organizationId } = auth.tenant;
      const orgMember = await OrganizationMember.findOne({
        userId,
        organizationId,
      }, { projectRoles: 1 });
      const projectIds = orgMember.get('projectRoles').map(member => member.projectId.toString());
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
