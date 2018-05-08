class ApiAuth {
  constructor({ key, err } = {}) {
    this.key = key;
    this.err = err;
    if (key && key.project) {
      this.project = key.project;
    }
  }

  isValid() {
    const error = this.getError();
    if (error) return false;
    return true;
  }

  getError() {
    if (this.err) return this.err instanceof Error ? this.err : new Error(this.err);
    if (!this.project) return new Error('No project was found.');
    return null;
  }

  hasProjectAccess() {
    return this.key && (this.key.scope === 'Organization' || this.key.scope === 'Project');
  }

  canRead() {
    this.check();
    const canRead = this.hasProjectAccess() && this.key.purpose === 'Public';
    if (!canRead) throw new Error('You do not have access to read from this resource.');
    return canRead;
  }

  canWrite() {
    this.check();
    const canWrite = this.hasProjectAccess() && this.key.purpose === 'Private';
    if (!canWrite) throw new Error('You do not have access to write to this resource.');
    return canWrite;
  }

  check() {
    if (!this.isValid()) throw new Error('You must be logged-in to access this resource.');
    return this.isValid();
  }
}

module.exports = ApiAuth;
