const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Organization = require('../../models/organization');
const OrganizationMember = require('../../models/organization-member');
const Project = require('../../models/project');
const User = require('../../models/user');
const orgService = require('../../services/organization');
const memberService = require('../../services/organization-member');

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
      const member = await memberService.isOrgMember(auth.user.id, id);
      if (!member) throw new Error('You do not have permission to read this organization.');

      const record = await Organization.findById(id);
      if (!record) throw new Error(`No organization record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allOrganizations: async (root, { pagination, sort }, { auth }) => {
      auth.check();
      const organizationIds = await memberService.getUserOrgIds(auth.user.id);
      const criteria = { _id: { $in: organizationIds } };
      return Organization.paginate({ pagination, sort, criteria });
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
      auth.checkApiWrite();
      const { name } = input;
      const organization = await Organization.create({ name });
      await memberService.createOrgOwner(auth.user.id, organization.id);
      return organization;
    },

    /**
     *
     */
    inviteUserToOrg: async (root, { input }, { auth }) => {
      await auth.checkOrgWrite();
      const organization = await auth.tenant.getOrganization();
      return orgService.inviteUserToOrg(organization, input);
    },

    acknowledgeUserInvite: (root, { token }) => orgService.acknowledgeUserInvite(token),

    /**
     *
     */
    updateOrganization: async (root, { input }, { auth }) => {
      auth.check();
      auth.checkApiWrite();
      const { id, payload } = input;
      const canWrite = await memberService.canWriteToOrg(auth.user.id, id);
      if (!canWrite) throw new Error('You do not have permission to write to this organization.');
      return Organization.findAndSetUpdate(id, payload);
    },
  },
};
