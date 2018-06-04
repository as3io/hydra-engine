const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Project = require('../../models/project');
const Repo = require('../../repositories/project');
const MemberService = require('../../services/organization-member');
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
  Query: {
    /**
     *
     */
    project: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const { organizationId } = auth.tenant;
      const member = await MemberService.isProjectMember(auth.user.id, organizationId, id);
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
      const projectIds = await MemberService.getUserProjectIds(auth.user.id, organizationId);
      const criteria = { _id: { $in: projectIds } };
      return Project.paginate({ pagination, sort, criteria });
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
      const { name, description } = input;
      const { organizationId } = auth.tenant;
      return Repo.create({ name, description, organizationId });
    },

    /**
     *
     */
    updateProject: async (root, { input }, { auth }) => {
      auth.check();
      auth.checkApiWrite();
      const { organizationId } = auth.tenant;
      const { id, payload } = input;
      const canWrite = await MemberService.canWriteToProject(auth.user.id, organizationId, id);
      if (!canWrite) throw new Error('You do not have permission to write to this project.');
      return Repo.update(id, payload);
    },
  },
};
