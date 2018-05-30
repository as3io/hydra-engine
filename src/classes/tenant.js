const OrganizationRepo = require('../repositories/organization');
const ProjectRepo = require('../repositories/project');

class Tenant {
  constructor({ organizationId, projectId } = {}) {
    this.organizationId = organizationId;
    this.projectId = projectId;
  }

  getOrganization() {
    if (this.organization) return this.organization;
    this.organization = OrganizationRepo.findById(this.organizationId);
    return this.organization;
  }

  getProject() {
    if (this.project) return this.project;
    this.project = ProjectRepo.findById(this.projectId);
    return this.project;
  }
}

module.exports = Tenant;
