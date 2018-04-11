const Repo = require('../../repositories/organization');
const Project = require('../../models/project');
const User = require('../../models/user');
const paginationResolvers = require('./pagination');

module.exports = {
  /**
   *
   */
  Organization: {
    projects: ({ id }) => Project.find({ organization: id }),
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
  },
};
