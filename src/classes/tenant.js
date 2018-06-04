const Organization = require('../models/organization');
const Project = require('../models/project');

class Tenant {
  constructor({ organizationId, projectId } = {}) {
    this.organizationId = organizationId;
    this.projectId = projectId;
  }

  getOrganization() {
    if (this.organization) return this.organization;
    this.organization = Organization.findById(this.organizationId);
    return this.organization;
  }

  getProject() {
    if (this.project) return this.project;
    this.project = Project.findById(this.projectId);
    return this.project;
  }
}

module.exports = Tenant;
