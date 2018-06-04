const MemberService = require('../services/organization-member');

class Auth {
  constructor({
    user,
    session,
    tenant,
    err,
  } = {}) {
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

  async checkProjectRead() {
    this.check();
    const { organizationId, projectId } = this.tenant;
    const isMember = await MemberService.isProjectMember(this.user.id, organizationId, projectId);
    if (!isMember) throw new Error('You are not permitted to read from this project.');
    return true;
  }

  async checkProjectWrite() {
    this.check();
    const { organizationId, projectId } = this.tenant;
    const canWrite = await MemberService.canWriteToProject(this.user.id, organizationId, projectId);
    if (!canWrite) throw new Error('You are not permitted to write to this project.');
    this.checkApiWrite();
    return true;
  }

  async checkOrgRead() {
    this.check();
    const { organizationId } = this.tenant;
    const isMember = await MemberService.isOrgMember(this.user.id, organizationId);
    if (!isMember) throw new Error('You are not permitted to read from this organization.');
    return true;
  }

  async checkOrgWrite() {
    this.check();
    const { organizationId } = this.tenant;
    const canWrite = await MemberService.canWriteToOrg(this.user.id, organizationId);
    if (!canWrite) throw new Error('You are not permitted to write to this organization.');
    this.checkApiWrite();
    return true;
  }

  async getOrgMembership() {
    this.check();
    const member = await MemberService.getMembership(this.user.id, this.tenant.organizationId);
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
