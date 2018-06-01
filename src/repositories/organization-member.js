const OrganizationMember = require('../models/organization-member');

module.exports = {
  /**
   * Retrieves the membership for the provided user and org IDs.
   * Will NOT error if the membership is not found, and instead will
   * resolve to `null`.
   *
   * @param {string} userId
   * @param {string} organizationId
   */
  async getMembership(userId, organizationId) {
    const errorPrefix = 'Unable to retrieve organization membership';
    if (!userId) throw new Error(`${errorPrefix}: No user ID was provided.`);
    if (!organizationId) throw new Error(`${errorPrefix}: No organization ID was provided.`);

    return OrganizationMember.findOne({ organizationId, userId });
  },

  /**
   * Returns the admin roles.
   *
   * @return {string[]}
   */
  getAdminRoles() {
    return ['Owner', 'Administrator'];
  },

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
    }, { _id: 1 });
    if (member) return true;
    return false;
  },

  /**
   * Determines if the provided user is a member of the organization project.
   *
   * @param {string} userId
   * @param {string} organizationId
   */
  async isProjectMember(userId, organizationId, projectId) {
    const member = await OrganizationMember.findOne({
      userId,
      organizationId,
      'projectRoles.projectId': projectId,
    }, { _id: 1 });
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
