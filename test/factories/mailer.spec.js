const sgMail = require('@sendgrid/mail');
const emailTemplates = require('../../src/email-templates');
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
    const user = { toAddress: 'Jane Doe <jd@foo.com>' };
    beforeEach(async function() {
      sandbox.stub(emailTemplates, 'render').resolves('<h1>Hello World!</h1>');
      sandbox.stub(mailer, 'send').resolves();
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should render the template.', async function() {
      await expect(mailer.sendWelcomeVerification(user, 'some-token')).to.be.fulfilled;
      sandbox.assert.calledOnce(emailTemplates.render);
      sandbox.assert.calledWith(emailTemplates.render, 'welcome', {
        user,
        subject: 'Welcome to Cool app',
        href: 'https://google.com/actions/magic-login/some-token',
      });
    });

    it('should send the email.', async function() {
      await expect(mailer.sendWelcomeVerification(user, 'some-token')).to.be.fulfilled;
      sandbox.assert.calledOnce(mailer.send);
      sandbox.assert.calledWith(mailer.send, {
        to: user.toAddress,
        subject: 'Welcome to Cool app',
        html: '<h1>Hello World!</h1>',
      });
    });
  });

  describe('#sendOrganizationInvitation', function() {
    const user = { toAddress: 'Jane Doe <jd@foo.com>' };
    const organization = { name: 'Foo Org' };
    beforeEach(async function() {
      sandbox.stub(emailTemplates, 'render').resolves('<h1>Hello World!</h1>');
      sandbox.stub(mailer, 'send').resolves();
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should render the template.', async function() {
      await expect(mailer.sendOrganizationInvitation(organization, user, 'some-token')).to.be.fulfilled;
      sandbox.assert.calledOnce(emailTemplates.render);
      sandbox.assert.calledWith(emailTemplates.render, 'organization-invite', {
        organization,
        user,
        subject: `You have been invited to the ${organization.name} organization.`,
        href: 'https://google.com/actions/organization-invite/some-token',
      });
    });

    it('should send the email.', async function() {
      await expect(mailer.sendOrganizationInvitation(organization, user, 'some-token')).to.be.fulfilled;
      sandbox.assert.calledOnce(mailer.send);
      sandbox.assert.calledWith(mailer.send, {
        to: user.toAddress,
        subject: `You have been invited to the ${organization.name} organization.`,
        html: '<h1>Hello World!</h1>',
      });
    });
  });

  describe('#sendMagicLogin', function() {
    const user = { toAddress: 'Jane Doe <jd@foo.com>' };
    beforeEach(async function() {
      sandbox.stub(emailTemplates, 'render').resolves('<h1>Hello World!</h1>');
      sandbox.stub(mailer, 'send').resolves();
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should render the template.', async function() {
      await expect(mailer.sendMagicLogin(user, 'some-token')).to.be.fulfilled;
      sandbox.assert.calledOnce(emailTemplates.render);
      sandbox.assert.calledWith(emailTemplates.render, 'magic-login', {
        user,
        subject: 'Your Cool app magic login link',
        href: 'https://google.com/actions/magic-login/some-token',
      });
    });

    it('should send the email.', async function() {
      await expect(mailer.sendMagicLogin(user, 'some-token')).to.be.fulfilled;
      sandbox.assert.calledOnce(mailer.send);
      sandbox.assert.calledWith(mailer.send, {
        to: user.toAddress,
        subject: 'Your Cool app magic login link',
        html: '<h1>Hello World!</h1>',
      });
    });
  });

  describe('#sendPasswordReset', function() {
    const user = { toAddress: 'Jane Doe <jd@foo.com>' };
    beforeEach(async function() {
      sandbox.stub(emailTemplates, 'render').resolves('<h1>Hello World!</h1>');
      sandbox.stub(mailer, 'send').resolves();
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should render the template.', async function() {
      await expect(mailer.sendPasswordReset(user, 'some-token')).to.be.fulfilled;
      sandbox.assert.calledOnce(emailTemplates.render);
      sandbox.assert.calledWith(emailTemplates.render, 'reset-password', {
        user,
        subject: 'Your Cool app password reset request',
        href: 'https://google.com/actions/reset-password/some-token',
      });
    });

    it('should send the email.', async function() {
      await expect(mailer.sendPasswordReset(user, 'some-token')).to.be.fulfilled;
      sandbox.assert.calledOnce(mailer.send);
      sandbox.assert.calledWith(mailer.send, {
        to: user.toAddress,
        subject: 'Your Cool app password reset request',
        html: '<h1>Hello World!</h1>',
      });
    });
  });

});
