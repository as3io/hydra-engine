const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Repo = require('../../repositories/organization');
const Model = require('../../models/organization');
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
      const { payload } = input;
      const organization = await Repo.create(payload);
      await OrganizationMember.create({
        userId: auth.user.id,
        role: 'Owner',
        acceptedAt: new Date(),
      }).save();
      return organization;
    },

    /**
     *
     */
    updateOrganization: (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      return Repo.update(id, payload);
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
    configureOrganization: async (root, { input }, { auth }) => {
      auth.check();
      const model = await Model.findById(input.organizationId);
      const { name, description, photoURL } = input;
      model.set('name', name);
      model.set('description', description);
      model.set('photoURL', photoURL);
      return model.save();
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
