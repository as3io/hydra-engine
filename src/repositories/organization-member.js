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
};
