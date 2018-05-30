class Tenant {
  constructor({ organizationId, projectId } = {}) {
    this.organizationId = organizationId;
    this.projectId = projectId;
  }
}

module.exports = Tenant;
