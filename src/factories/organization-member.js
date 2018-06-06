const OrganizationMember = require('../models/organization-member');
const Project = require('../models/project');

const prototype = {
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
   * Returns the organization admin roles.
   *
   * @return {string[]}
   */
  getOrgAdminRoles() {
    return ['Owner', 'Administrator'];
  },

  /**
   * Returns the organization admin roles.
   *
   * @return {string[]}
   */
  getProjectAdminRoles() {
    return ['Owner', 'Administrator'];
  },

  /**
   * Determines if the provided role name is considered an org admin.
   *
   * @param {string} role
   */
  isOrgAdmin(role) {
    return this.getOrgAdminRoles().includes(role);
  },

  /**
   * Determines if the provided role name is considered a project admin.
   *
   * @param {string} role
   */
  isProjectAdmin(role) {
    return this.getProjectAdminRoles().includes(role);
  },

  /**
   * Gets the role for the provided organization.
   * If no role is found, this method will NOT reject, and instead
   * will resolve as `null`.
   *
   * @param {string} userId
   * @param {string} organizationId
   */
  async getOrgRole(userId, organizationId) {
    const member = await this.getMembership(userId, organizationId);
    if (!member) return null;
    return member.role || null;
  },

  /**
   * Determines if the provided user is a member of the organization.
   *
   * @param {string} userId
   * @param {string} organizationId
   */
  async isOrgMember(userId, organizationId) {
    const role = await this.getOrgRole(userId, organizationId);
    if (role) return true;
    return false;
  },

  /**
   * Determines if the provided user can write to the provided organization.
   *
   * @param {string} userId
   * @param {string} organizationId
   */
  async canWriteToOrg(userId, organizationId) {
    const role = await this.getOrgRole(userId, organizationId);
    if (this.isOrgAdmin(role)) return true;
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
    // Use the organization role if an org admin.
    if (this.isOrgAdmin(role)) return role;
    const found = projectRoles.find(r => `${r.projectId}` === `${projectId}`);
    if (!found) return null;
    return found.role || null;
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
    if (this.isOrgAdmin(role) || this.isProjectAdmin(role)) return true;
    return false;
  },

  /**
   * Gets all organization ids that the provided user is a member of.
   * Will cast all org ids to string.
   *
   * @param {string} userId
   */
  async getUserOrgIds(userId) {
    if (!userId) throw new Error('Unable to retrieve user organizations. No user ID was provided.');
    const orgMembers = await OrganizationMember.find({ userId }, { organizationId: 1 });
    return orgMembers.map(member => member.organizationId.toString());
  },

  /**
   * Gets all organization project ids that the provided user is a member of.
   * Will cast all project ids to string.
   *
   * @param {string} userId
   */
  async getUserProjectIds(userId, organizationId) {
    const role = await this.getOrgRole(userId, organizationId);
    if (!role) return [];
    if (this.isOrgAdmin(role)) {
      // For org admins, return all org project IDs directly.
      const projects = await Project.find({ organizationId }, { _id: 1 });
      return projects.map(p => p.id.toString());
    }
    // For non org admins, only return specifically assigned project IDs.
    const member = await this.getMembership(userId, organizationId);
    const { projectRoles } = member;
    return projectRoles.map(r => r.projectId.toString());
  },

  /**
   * Creates a new org owner membership record.
   * Assumes that the `userId` and `organizationId` exist and are valid.
   *
   * @param {string} userId
   * @param {string} organizationId
   */
  async createOrgOwner(userId, organizationId) {
    const member = await this.getMembership(userId, organizationId);
    if (member) throw new Error('The provided user is already a member of the organization.');

    return OrganizationMember.create({
      userId,
      organizationId,
      role: 'Owner',
      acceptedAt: new Date(),
    });
  },
};

const { create } = Object;

module.exports = () => create(prototype);
