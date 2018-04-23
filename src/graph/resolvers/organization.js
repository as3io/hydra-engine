const Repo = require('../../repositories/organization');
const Model = require('../../models/organization');
const Project = require('../../models/project');
const User = require('../../models/user');
const Key = require('../../models/key');
const paginationResolvers = require('./pagination');

module.exports = {
  /**
   *
   */
  Organization: {
    projects: ({ id }) => Project.find({ organization: id }),
    accepted: (org, _args, { auth }) => {
      const { uid } = auth.session;
      for (let i = 0; i < org.members.length; i += 1) {
        const member = org.members[i];
        if (member.user == uid && member.accepted) return true; // eslint-disable-line eqeqeq
      }
      return false;
    },
    role: (org, _args, { auth }) => {
      const { uid } = auth.session;
      for (let i = 0; i < org.members.length; i += 1) {
        const member = org.members[i];
        if (member.user == uid) return member.role; // eslint-disable-line eqeqeq
      }
      return null;
    },
    keys: ({ id }) => Key.find({ organization: id }),
  },
  /**
   *
   */
  OrganizationMembership: {
    user: orgMember => User.findById(orgMember.user),
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
      auth.check();
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
      // const criteria = {
      //   "members.user": auth.uid,
      // };
      // return Repo.paginate({ criteria, pagination, sort });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createOrganization: (root, { input }, { auth }) => {
      auth.check();
      const { payload } = input;
      payload.members = [{
        user: auth.user._id,
        role: 'Owner',
        accepted: new Date(),
      }];
      return Repo.create(payload);
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
