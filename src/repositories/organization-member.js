const OrganizationMember = require('../models/organization-member');

module.exports = {
  /**
   * Determines if the provided user is a member of the organization.
   *
   * @param {string} userId
   * @param {string} organizationId
   */
  async isOrgMember(userId, organizationId) {
    const member = await OrganizationMember.findOne({
      userId,
      organizationId,
    }, { organizationId: 1 });
    if (member) return true;
    return false;
  },

  /**
   * Gets all organization ids that the provided user is a member of.
   * Will cast all org ids to string.
   *
   * @param {string} userId
   */
  async getUserOrgIds(userId) {
    const orgMembers = await OrganizationMember.find({ userId }, { organizationId: 1 });
    return orgMembers.map(member => member.organizationId.toString());
  },

  /**
   * Creates a new org owner membership record.
   * Assumes that the `userId` and `organizationId` exist and are valid.
   *
   * @param {string} userId
   * @param {string} organizationId
   */
  async createOrgOwner(userId, organizationId) {
    return OrganizationMember.create({
      userId,
      organizationId,
      role: 'Owner',
      acceptedAt: new Date(),
    });
  },
};
