const sgMail = require('@sendgrid/mail');
const emailTemplates = require('../email-templates');

const prototype = {
  async send({ to, subject, html }) {
    if (!to) throw new Error('Unable to send email: no to address was provided.');
    if (!subject) throw new Error('Unable to send email: no subject was provided.');
    if (!html) throw new Error('Unable to send email: no body was provided.');

    const payload = {
      to,
      from: this.fromAddress,
      subject,
      html,
    };

    sgMail.setApiKey(this.apiKey);
    return sgMail.send(payload);
  },

  async sendWelcomeVerification(user, token) {
    const to = user.toAddress;
    const subject = `Welcome to ${this.appName}`;
    const html = await emailTemplates.render('welcome', {
      user,
      subject,
      href: `${this.baseURI}/actions/magic-login/${token}`,
    });
    return this.send({ to, subject, html });
  },

  async sendOrganizationInvitation(organization, user, token) {
    const to = user.toAddress;
    const subject = `You have been invited to the ${organization.name} organization.`;
    const html = await emailTemplates.render('organization-invite', {
      organization,
      user,
      subject,
      href: `${this.baseURI}/actions/organization-invite/${token}`,
    });
    return this.send({ to, subject, html });
  },

  async sendMagicLogin(user, token) {
    const to = user.toAddress;
    const subject = `Your ${this.appName} magic login link`;
    const html = await emailTemplates.render('magic-login', {
      user,
      subject,
      href: `${this.baseURI}/actions/magic-login/${token}`,
    });
    return this.send({ to, subject, html });
  },

  async sendPasswordReset(user, token) {
    const to = user.toAddress;
    const subject = `Your ${this.appName} password reset request`;
    const html = await emailTemplates.render('reset-password', {
      user,
      subject,
      href: `${this.baseURI}/actions/reset-password/${token}`,
    });
    return this.send({ to, subject, html });
  },
};

const { create, assign } = Object;

module.exports = ({
  appName,
  baseURI,
  fromAddress,
  apiKey,
} = {}) => {
  const prefix = 'Unable to initialize the mailer';
  if (!appName) throw new Error(`${prefix}: no value was provided for the app name.`);
  if (!baseURI) throw new Error(`${prefix}: no value was provided for the base URI.`);
  if (!fromAddress) throw new Error(`${prefix}: no value was provided for the from address.`);
  if (!apiKey) throw new Error(`${prefix}: no value was provided for the API key.`);
  const obj = create(prototype);
  return assign(obj, {
    appName,
    baseURI,
    fromAddress,
    apiKey,
  });
};
