require('../connections');
const mailer = require('../../src/services/mailer');
const env = require('../../src/env');

describe('services/mailer', function() {
  it('should return the session object.', async function() {
    expect(mailer).to.respondTo('send');
    expect(mailer).to.respondTo('sendWelcomeVerification');
    expect(mailer).to.respondTo('sendOrganizationInvitation');
    expect(mailer).to.respondTo('sendMagicLogin');
    expect(mailer).to.respondTo('sendPasswordReset');
  });

  it('should set the app name from the environment.', async function() {
    expect(mailer.appName).to.equal(env.APP_NAME);
  });

  it('should set the base URI from the environment.', async function() {
    expect(mailer.baseURI).to.equal(env.BASE_URI_APP);
  });

  it('should set the from address from the environment.', async function() {
    expect(mailer.fromAddress).to.equal(env.SENDGRID_FROM);
  });

  it('should set the api key from the environment.', async function() {
    expect(mailer.apiKey).to.equal(env.SENDGRID_API_KEY);
  });
});
