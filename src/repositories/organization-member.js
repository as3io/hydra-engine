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

  isAdminRole(role) {
    return this.getAdminRoles().includes(role);
  },

  /**
   * Determines if the provided user is a member of the organization.
   *
   * @param {string} userId
   * @param {string} organizationId
   */
  async isOrgMember(userId, organizationId) {
    const member = await this.getMembership(userId, organizationId);
    if (member) return true;
    return false;
  },

  /**
   * Gets the role for the provided project.
   * If no role is found, this method will NOT reject, and instead
   * will resolve as `null`.
   *
   * @param {string} userId
   * @param {string} organizationId
   * @param {string} projectId
   */
  async getProjectRole(userId, organizationId, projectId) {
    if (!projectId) throw new Error('Unable to retrieve project role: no project ID was provided.');
    const member = await this.getMembership(userId, organizationId);
    if (!member) return null;
    const { role, projectRoles } = member;
    // Use the organization role if an admin.
    if (this.isAdminRole(role)) return role;
    const found = projectRoles.find(r => `${r.projectId}` === `${projectId}`);
    if (found) return found.role || null;
    return null;
  },

  /**
   * Determines if the provided user is a member of the organization project.
   *
   * @param {string} userId
   * @param {string} organizationId
   * @param {string} projectId
   */
  async isProjectMember(userId, organizationId, projectId) {
    const role = await this.getProjectRole(userId, organizationId, projectId);
    if (role) return true;
    return false;
  },

  /**
   * Determines if the provided user can write to the provided organization project.
   *
   * @param {string} userId
   * @param {string} organizationId
   * @param {string} projectId
   */
  async canWriteToProject(userId, organizationId, projectId) {
    const role = await this.getProjectRole(userId, organizationId, projectId);
    if (this.isAdminRole(role)) return true;
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
