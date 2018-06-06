const sgMail = require('@sendgrid/mail');
const Mailer = require('../../src/factories/mailer');

const sandbox = sinon.createSandbox();

const mailer = Mailer({
  appName: 'Cool app',
  baseURI: 'https://google.com',
  fromAddress: 'John Doe <jdoe@google.com>',
  apiKey: 'some-api-key',
});


describe('factories/mailer', function() {
  it('should throw when no app name is provided.', async function() {
    expect(() => Mailer({
      baseURI: 'https://google.com',
      fromAddress: 'John Doe <jdoe@google.com>',
      apiKey: 'some-api-key',
    })).to.throw(Error, 'Unable to initialize the mailer: no value was provided for the app name.');
  });
  it('should throw when no base URI is provided.', async function() {
    expect(() => Mailer({
      appName: 'Cool app',
      fromAddress: 'John Doe <jdoe@google.com>',
      apiKey: 'some-api-key',
    })).to.throw(Error, 'Unable to initialize the mailer: no value was provided for the base URI.');
  });
  it('should throw when no from address is provided.', async function() {
    expect(() => Mailer({
      appName: 'Cool app',
      baseURI: 'https://google.com',
      apiKey: 'some-api-key',
    })).to.throw(Error, 'Unable to initialize the mailer: no value was provided for the from address.');
  });
  it('should throw when no api key is provided.', async function() {
    expect(() => Mailer({
      appName: 'Cool app',
      baseURI: 'https://google.com',
      fromAddress: 'John Doe <jdoe@google.com>',
    })).to.throw(Error, 'Unable to initialize the mailer: no value was provided for the API key.');
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
      sandbox.assert.calledWith(sgMail.setApiKey, 'some-api-key');
    });
    it('should send the email payload.', async function() {
      await expect(mailer.send(values)).to.be.fulfilled;
      const payload = { ...values, from: 'John Doe <jdoe@google.com>' };
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
