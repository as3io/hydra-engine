require('../connections');
const sessionService = require('../../src/services/session');
const env = require('../../src/env');

describe('services/session', function() {
  it('should return the session object.', async function() {
    expect(sessionService).to.respondTo('delete');
    expect(sessionService).to.respondTo('get');
    expect(sessionService).to.respondTo('set');
  });

  it('should set the secret global secret from the environment.', async function() {
    expect(sessionService.globalSecret).to.equal(env.SESSION_GLOBAL_SECRET);
  });

  it('should set the session from the environment.', async function() {
    expect(sessionService.namespace).to.equal(env.SESSION_NAMESPACE);
  });

  it('should set the expiration from the environment.', async function() {
    expect(sessionService.expires).to.equal(env.SESSION_EXPIRATION);
  });
});
