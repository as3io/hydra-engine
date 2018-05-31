const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Repo = require('../../repositories/organization');
const OrganizationMember = require('../../models/organization-member');
const Project = require('../../models/project');
const User = require('../../models/user');

module.exports = {
  /**
   *
   */
  Organization: {
    projects: ({ id }) => Project.find({ organizationId: id }),
  },
  /**
   *
   */
  OrganizationMember: {
    user: orgMember => User.findById(orgMember.userId),
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
      await auth.checkOrgRead();
      const { id } = input;
      const record = await Repo.findById(id);
      if (!record) throw new Error(`No organization record found for ID ${id}.`);
      return record;
    },

    /**
     * @todo Implement filtering by what the user has access to
     */
    allOrganizations: (root, { pagination, sort }, { auth }) => {
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
    createOrganization: async (root, { input }, { auth }) => {
      auth.check();
      const { name } = input;
      const organization = await Repo.create({ name });
      await OrganizationMember.create({
        userId: auth.user.id,
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
      const { payload } = input;
      const organization = await auth.tenant.getOrganization();
      return Repo.inviteUserToOrg(organization, payload);
    },

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

    /**
     *
     */
    organizationInviteAccept: (root, { input }, { auth }) => {
      auth.check();
      const { organization } = input;
      Repo.acceptInvitation(organization, auth.session.uid);
    },
  },
};
