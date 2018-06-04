const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Repo = require('../../repositories/organization');
const OrganizationMember = require('../../models/organization-member');
const OrgMemberRepo = require('../../repositories/organization-member');
const Organization = require('../../models/organization');
const Project = require('../../models/project');
const User = require('../../models/user');

module.exports = {
  /**
   *
   */
  Organization: {
    projects: ({ id }) => Project.find({ organizationId: id }),
    members: ({ id }) => OrganizationMember.find({ organizationId: id }),
  },
  /**
   *
   */
  OrganizationMember: {
    user: orgMember => User.findById(orgMember.userId),
    organization: orgMember => Organization.findById(orgMember.organizationId),
  },
  /**
   *
   */
  OrganizationConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    organization: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const member = await OrgMemberRepo.isOrgMember(auth.user.id, id);
      if (!member) throw new Error('You do not have permission to read this organization.');

      const record = await Repo.findById(id);
      if (!record) throw new Error(`No organization record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allOrganizations: async (root, { pagination, sort }, { auth }) => {
      auth.check();
      const organizationIds = await OrgMemberRepo.getUserOrgIds(auth.user.id);
      const criteria = { _id: { $in: organizationIds } };
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
    createOrganization: async (root, { input }, { auth }) => {
      auth.check();
      const { name } = input;
      const organization = await Repo.create({ name });
      await OrgMemberRepo.createOrgOwner(auth.user.id, organization.id);
      return organization;
    },

    /**
     *
     */
    inviteUserToOrg: async (root, { input }, { auth }) => {
      await auth.checkOrgWrite();
      const organization = await auth.tenant.getOrganization();
      return Repo.inviteUserToOrg(organization, input);
    },

    acknowledgeUserInvite: (root, { token }) => Repo.acknowledgeUserInvite(token),

    /**
     *
     */
    updateOrganization: async (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const canWrite = await OrgMemberRepo.canWriteToOrg(auth.user.id, id);
      if (!canWrite) throw new Error('You do not have permission to write to this organization.');
      return Repo.update(id, payload);
    },
  },
};
