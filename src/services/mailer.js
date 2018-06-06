const sgMail = require('@sendgrid/mail');
const env = require('../utils/get-env');
const emailTemplates = require('../email-templates');

const {
  APP_BASE_URI,
  APP_NAME,
} = process.env;

module.exports = {
  async send({ to, subject, html }) {
    if (!to) throw new Error('Unable to send email: no to address was provided.');
    if (!subject) throw new Error('Unable to send email: no subject was provided.');
    if (!html) throw new Error('Unable to send email: no body was provided.');

    const payload = {
      to,
      from: env.get('SENDGRID_FROM', true),
      subject,
      html,
    };

    sgMail.setApiKey(env.get('SENDGRID_API_KEY', true));
    return sgMail.send(payload);
  },

  async sendWelcomeVerification(user, token) {
    const to = user.toAddress;
    const subject = `Welcome to ${APP_NAME}`;
    const html = await emailTemplates.render('welcome', {
      user,
      subject,
      href: `${APP_BASE_URI}/actions/magic-login/${token}`,
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
      href: `${APP_BASE_URI}/actions/organization-invite/${token}`,
    });
    return this.send({ to, subject, html });
  },

  async sendMagicLogin(user, token) {
    const to = user.toAddress;
    const subject = `Your ${APP_NAME} magic login link`;
    const html = await emailTemplates.render('magic-login', {
      user,
      subject,
      href: `${APP_BASE_URI}/actions/magic-login/${token}`,
    });
    return this.send({ to, subject, html });
  },

  async sendPasswordReset(user, token) {
    const to = user.toAddress;
    const subject = `Your ${APP_NAME} password reset request`;
    const html = await emailTemplates.render('reset-password', {
      user,
      subject,
      href: `${APP_BASE_URI}/actions/reset-password/${token}`,
    });
    return this.send({ to, subject, html });
  },
};
