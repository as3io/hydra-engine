const OrganizationMember = require('../models/organization-member');
const User = require('../models/user');
const tokenGenerator = require('../services/token-generator');
const mailer = require('../services/mailer');

module.exports = {
  /**
   *
   * @param {string} id
   * @param {object} payload
   * @param {string} payload.name
   * @return {Promise}
   */
  async update(id, { name, description, photoURL } = {}) {
    if (!id) throw new Error('Unable to update organization: no ID was provided.');
    const org = await this.findById(id);
    if (!org) throw new Error(`Unable to update organization: no record was found for ID '${id}'`);
    org.set({ name, description, photoURL });
    return org.save();
  },

  /**
   *
   */
  async inviteUserToOrg(organization, {
    email,
    givenName,
    familyName,
    role,
    projectRoles,
  } = {}) {
    let user = await User.findByEmail(email);
    if (!user) {
      user = await User.create({ email, givenName, familyName });
      await user.save();
    }

    const userId = user.id;
    const organizationId = organization.id;

    await OrganizationMember.remove({ userId, organizationId });

    const orgMember = await OrganizationMember.create({
      organizationId,
      userId,
      projectRoles: projectRoles || [],
      role,
    });

    const token = await tokenGenerator.create('user-org-invitation', {
      uid: userId,
      oid: organizationId,
    }, 60 * 60 * 24 * 30);

    // send welcome/invite email
    await mailer.sendOrganizationInvitation(organization, user, token);

    return orgMember;
  },

  async acknowledgeUserInvite(jwt) {
    const token = await tokenGenerator.verify('user-org-invitation', jwt);
    const userId = token.payload.uid;
    const organizationId = token.payload.oid;
    const orgMember = await OrganizationMember.findOne({ userId, organizationId });
    if (!orgMember) throw new Error('No organization membership was found for the provided token.');
    orgMember.acceptedAt = new Date();
    await orgMember.save();
    await tokenGenerator.invalidate(token.id);
    return orgMember;
  },
};
