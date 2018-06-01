const OrgMemberRepo = require('../repositories/organization-member');

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
    const { role, projectRoles } = await this.getOrgMembership();
    if (this.adminRoles.includes(role)) return true;
    const valid = projectRoles.filter(pRole => `${pRole.projectId}` === `${this.tenant.projectId}`);
    if (!valid.length) throw new Error('You are not permitted to read from this project.');
    return true;
  }

  async checkProjectWrite() {
    const { role, projectRoles } = await this.getOrgMembership();
    if (this.adminRoles.includes(role)) return true;
    const valid = projectRoles.filter(pRole => `${pRole.projectId}` === `${this.tenant.projectId}` && this.adminRoles.includes(pRole.role));
    if (!valid.length) throw new Error('You are not permitted to write to this project.');
    this.checkApiWrite();
    return true;
  }

  async checkOrgRead() {
    const { role } = await this.getOrgMembership();
    if (!role) throw new Error('You are not permitted to read from this organization.');
    return true;
  }

  async checkOrgWrite() {
    const { role } = await this.getOrgMembership();
    if (!this.adminRoles.includes(role)) throw new Error('You are not permitted to write to this organization.');
    this.checkApiWrite();
    return true;
  }

  async getOrgMembership() {
    this.check();
    const member = await OrgMemberRepo.getMembership(this.user.id, this.tenant.organizationId);
    if (!member) throw new Error('You are not a member of this organization.');
    return member;
  }

  check() {
    if (!this.isValid()) throw new Error('You must be logged-in to access this resource.');
  }

  checkApiWrite() {
    if (this.fromApi() && !this.session.api.secret) throw new Error('You must provide a secret to write via the API.');
  }

  fromApi() {
    if (!this.isValid()) return false;
    return this.session.api && this.session.api.key;
  }
}

module.exports = Auth;
