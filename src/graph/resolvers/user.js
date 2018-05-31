const { paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const UserRepo = require('../../repositories/user');
const OrganizationMember = require('../../models/organization-member');
const SessionRepo = require('../../repositories/session');

module.exports = {
  /**
   *
   */
  User: {
    hasPassword: user => !(!user.password),
    memberships: user => OrganizationMember.find({ userId: user.id }),
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
    generateUserApiKey: async (root, args, { auth }) => {
      auth.check();
      const { user } = auth;
      user.api = {};
      await user.save();
      return user.api;
    },

    /**
     *
     */
    createUser: async (root, { input }) => {
      const { payload } = input;
      const user = await UserRepo.create(payload);
      await UserRepo.sendWelcomeVerification(user);
      return user;
    },

    /**
     *
     */
    loginUser: (root, { input }) => {
      const { email, password } = input;
      return UserRepo.login(email, password);
    },

    loginWithApiKey: (root, { input }) => {
      const { key, secret } = input;
      return UserRepo.loginWithApiKey(key, secret);
    },

    /**
     *
     */
    loginWithMagicToken: (root, { token }) => UserRepo.loginWithMagicToken(token),

    /**
     *
     */
    resetPassword: async (root, { input }) => {
      const { token, password } = input;
      await UserRepo.resetPassword(token, password);
      return true;
    },

    /**
     *
     */
    sendPasswordResetEmail: (root, { email }) => UserRepo.sendPasswordResetEmail(email),

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
    sendMagicLoginEmail: (root, { email }) => UserRepo.sendMagicLoginEmail(email),
  },
};
