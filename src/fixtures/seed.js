const Promise = require('bluebird');
const fixtures = require('./index');
const models = require('../models');

const create = async (Model, count, params) => {
  const results = fixtures(Model, count, params);
  if (results.length === 1) {
    const result = results.one();
    await result.save();
    return result;
  }
  await Promise.all(results.all().map(model => model.save()));
  return results.all();
};

module.exports = {
  /**
   * @param {number} count
   */
  async users(count) {
    const { User } = models;
    return create(User, count);
  },

  /**
   * @param {number} count
   */
  async organizations(count) {
    const { Organization } = models;
    return create(Organization, count);
  },

  /**
   * @param {number} count
   */
  async organizationMembers(count) {
    const { OrganizationMember } = models;
    const project = await this.projects(1);
    const user = await this.users(1);
    const params = {
      userId: () => user.id,
      organizationId: () => project.organizationId,
      projectId: () => project.id,
    };
    return create(OrganizationMember, count, params);
  },

  /**
   * @param {number} count
   */
  async projects(count) {
    const { Project } = models;
    const organization = await this.organizations(1);
    const params = { organizationId: () => organization.id };
    return create(Project, count, params);
  },

  /**
   * @param {number} count
   */
  async stories(count) {
    const { Story } = models;
    const project = await this.projects(1);
    const params = { projectId: () => project.id };
    return create(Story, count, params);
  },
};
