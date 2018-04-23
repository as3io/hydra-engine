const Key = require('../../models/key');
const UserRepo = require('../../repositories/user');
const Organization = require('../../models/organization');
const SessionRepo = require('../../repositories/session');
const paginationResolvers = require('./pagination');

module.exports = {
  /**
   *
   */
  User: {
    hasPassword: user => !(!user.password),
    organizations: user => Organization.find({ 'members.user': user.id }),
    keys: ({ id }) => Key.find({ user: id }),
  },
  /**
   *
   */
  UserConnection: paginationResolvers.connection,

  /**
   *
   */
  UserEdge: paginationResolvers.edge,

  /**
   *
   */
  Query: {
    /**
     *
     */
    user: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await UserRepo.findById(id);
      if (!record) throw new Error(`No user record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allUsers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return UserRepo.paginate({ pagination, sort });
    },

    /**
     *
     */
    currentUser: (root, args, { auth }) => (auth.isValid() ? auth.user : null),

    /**
     *
     */
    checkSession: async (root, { input }) => {
      const { token } = input;
      const { user, session } = await UserRepo.retrieveSession(token);
      return { user, session };
    },
  },
  Mutation: {
    /**
     *
     */
    createUser: (root, { input }) => {
      const { payload } = input;
      return UserRepo.create(payload);
    },

    /**
     *
     */
    loginUser: (root, { input }) => {
      const { email, password } = input;
      return UserRepo.login(email, password);
    },

    /**
     *
     */
    loginFromToken: (root, { input }) => {
      const { token } = input;
      return UserRepo.loginFromToken(token);
    },

    /**
     *
     */
    setPassword: (root, { input }, { auth }) => {
      const { password } = input;
      return UserRepo.setPassword(auth.session.uid, password);
    },

    /**
     *
     */
    sendPasswordReset: (root, { input }) => {
      const { email } = input;
      return UserRepo.sendPasswordReset(email);
    },

    /**
     *
     */
    deleteSession: async (root, args, { auth }) => {
      if (auth.isValid()) {
        await SessionRepo.delete(auth.session);
      }
      return 'ok';
    },

    /**
     *
     */
    organizationInvite: async (root, { input }, { auth }) => {
      auth.check();
      const { organization, payload } = input;
      // role.check(Roles.Administrator || Roles.Owner);
      return UserRepo.organizationInvite(organization, payload);
    },

    /**
     *
     */
    magicLogin: (root, { input }) => {
      const { email } = input;
      return UserRepo.magicLogin(email);
    },
  },
};
