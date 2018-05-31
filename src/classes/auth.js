class Auth {
  constructor({
    user,
    session,
    tenant,
    err,
  } = {}) {
    this.adminRoles = ['Owner', 'Administrator'];
    this.user = user;
    this.session = session;
    this.err = err;
    this.tenant = tenant;
  }

  isValid() {
    const error = this.getError();
    if (error) return false;
    return true;
  }

  getError() {
    if (this.err) return this.err instanceof Error ? this.err : new Error(this.err);
    if (!this.session || !this.user) return new Error('No user or session was found.');
    return this.session.uid !== this.user.id ? new Error('Session-user mismatch encountered.') : null;
  }

  async hasRole(name) {
    if (!this.isValid()) return false;
    const { role } = await this.getOrgMembership();
    return role === name;
  }

  isAdmin() {
    return this.hasRole('Admin');
  }

  async checkProjectRead() {
    this.check();
    const { role, projects } = await this.getOrgMembership();
    if (this.adminRoles.includes(role)) return true;
    const valid = projects.filter(project => `${project.id}` === `${this.tenant.projectId}`);
    if (!valid.length) throw new Error('You are not permitted to read from this project.');
    return true;
  }

  async checkProjectWrite() {
    this.check();
    const { role, projects } = await this.getOrgMembership();
    if (this.adminRoles.includes(role)) return true;
    const valid = projects.filter(project =>
      `${project.id}` === `${this.tenant.projectId}` && this.adminRoles.includes(project.role));
    if (!valid.length) throw new Error('You are not permitted to write to this project.');
    return true;
  }

  async checkOrgRead() {
    this.check();
    const { role } = await this.getOrgMembership();
    if (!role) throw new Error('You are not permitted to read from this organization.');
    return true;
  }

  async checkOrgWrite() {
    this.check();
    const { role } = await this.getOrgMembership();

    if (!this.adminRoles.includes(role)) throw new Error('You are not permitted to write to this organization.');
    return true;
  }

  async getOrgMembership() {
    const org = await this.tenant.getOrganization();
    const filtered = org.get('members').filter(member => `${member.user}` === `${this.user.id}`);
    return filtered.shift() || {};
  }

  check() {
    if (!this.isValid()) throw new Error('You must be logged-in to access this resource.');
  }

  fromApi() {
    if (!this.isValid()) return false;
    return this.session.api && this.session.api.key;
  }
}

module.exports = Auth;
