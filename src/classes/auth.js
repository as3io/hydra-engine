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

  hasRole(name) {
    if (!this.isValid()) return false;
    return this.user.role === name;
  }

  isAdmin() {
    return this.hasRole('Admin');
  }

  async checkProjectRead() {
    this.check();
  }

  async checkOrgRead() {
    this.check();
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
