const Organization = require('../models/organization');
const OrganizationMember = require('../models/organization-member');
const User = require('../models/user');
const tokenGenerator = require('../services/token-generator');
const mailer = require('../services/mailer');

const OrganizationService = () => ({
  /**
   * Invites a user to the provided organization.
   * If the user does not currently exist, it is created.
   *
   * @param {Organization} organization
   * @param {object} userParams
   */
  async inviteUserToOrg(organization, {
    email,
    givenName,
    familyName,
    role,
    projectRoles,
  } = {}) {
    if (!email) throw new Error('Unable to invite user to org: No email address was provided.');
    if (!(organization instanceof Organization)) throw new Error('Unable to invite user to org: No organization was provided.');
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

  /**
   * Acknowledges that a user accepted an org invitation, if the token is valid.
   *
   * @param {string} jwt The user invitation JWT.
   */
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
});

module.exports = OrganizationService();
