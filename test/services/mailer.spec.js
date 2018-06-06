const sgMail = require('@sendgrid/mail');
const mailer = require('../../src/services/mailer');

const sandbox = sinon.createSandbox();

const {
  SENDGRID_API_KEY,
  SENDGRID_FROM,
} = process.env;

describe('services/mailer', function() {

  beforeEach(async function() {
    process.env.SENDGRID_API_KEY = SENDGRID_API_KEY;
    process.env.SENDGRID_FROM = SENDGRID_FROM;
  });

  describe('#send', function() {
    let values;
    beforeEach(async function() {
      values = {
        to: 'John Doe <john@google.com>',
        subject: 'Test email',
        html: '<p>Hello world!</p>',
      };
      sandbox.spy(sgMail, 'setApiKey');
      sandbox.stub(sgMail, 'send').resolves();
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should reject when no sendgrid API key is set.', async function() {
      delete process.env.SENDGRID_API_KEY;
      await expect(mailer.send(values)).to.be.rejectedWith(Error, `The required environment variable 'SENDGRID_API_KEY' was not set.`);
    });
    it('should reject when no sendgrid from value is set.', async function() {
      delete process.env.SENDGRID_FROM;
      await expect(mailer.send(values)).to.be.rejectedWith(Error, `The required environment variable 'SENDGRID_FROM' was not set.`);
    });
    it('should reject when no `to` value is provided.', async function() {
      delete values.to;
      await expect(mailer.send(values)).to.be.rejectedWith(Error, 'Unable to send email: no to address was provided.');
    });
    it('should reject when no `subject` value is provided.', async function() {
      delete values.subject;
      await expect(mailer.send(values)).to.be.rejectedWith(Error, 'Unable to send email: no subject was provided.');
    });
    it('should reject when no `html` value is provided.', async function() {
      delete values.html;
      await expect(mailer.send(values)).to.be.rejectedWith(Error, 'Unable to send email: no body was provided.');
    });

    it('should set the sendgrid API key.', async function() {
      await expect(mailer.send(values)).to.be.fulfilled;
      sandbox.assert.calledOnce(sgMail.setApiKey);
      sandbox.assert.calledWith(sgMail.setApiKey, process.env.SENDGRID_API_KEY);
    });
    it('should send the email payload.', async function() {
      await expect(mailer.send(values)).to.be.fulfilled;
      const payload = { ...values, from: process.env.SENDGRID_FROM };
      sandbox.assert.calledOnce(sgMail.send);
      sandbox.assert.calledWith(sgMail.send, payload);
    });
  });

  describe('#sendWelcomeVerification', function() {
    it('should best tested.');
  });

  describe('#sendOrganizationInvitation', function() {
    it('should best tested.');
  });

  describe('#sendMagicLogin', function() {
    it('should best tested.');
  });

  describe('#sendPasswordReset', function() {
    it('should best tested.');
  });

});
