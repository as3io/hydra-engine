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
  OrganizationEdge: paginationResolvers.edge,

  /**
   *
   */
  Query: {
    /**
     *
     */
    organization: async (root, { input }, { auth }) => {
      await auth.check();
      const { id } = input;
      const member = await OrgMemberRepo.isOrgMember(auth.user.id, id);
      if (!member) throw new Error('You do not have permission to read this organization');

      const record = await Repo.findById(id);
      if (!record) throw new Error(`No organization record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allOrganizations: async (root, { pagination, sort }, { auth }) => {
      auth.check();
      const userId = auth.user.id;
      const members = await OrganizationMember.find({ userId }, { organizationId: 1 });
      const organizationIds = members.map(member => member.organizationId.toString());
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
      await OrganizationMember.create({
        userId: auth.user.id,
        organizationId: organization.id,
        role: 'Owner',
        acceptedAt: new Date(),
      });
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
      await auth.checkOrgWrite();
      const organization = await auth.tenant.getOrganization();
      const { name, description, photoURL } = input;
      organization.set({ name, description, photoURL });
      return organization.save();
    },
  },
};
