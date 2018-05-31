const sgMail = require('@sendgrid/mail');
const emailTemplates = require('../email-templates');

const {
  SENDGRID_API_KEY,
  SENDGRID_FROM,
  APP_BASE_URI,
  APP_NAME,
} = process.env;

module.exports = {
  async send({ to, subject, html }) {
    if (!SENDGRID_API_KEY) throw new Error('Required environment variable "SENDGRID_API_KEY" was not set.');
    if (!SENDGRID_FROM) throw new Error('Required environment variable "SENDGRID_FROM" was not set.');

    const payload = {
      to,
      from: SENDGRID_FROM,
      subject,
      html,
    };

    sgMail.setApiKey(SENDGRID_API_KEY);
    return sgMail.send(payload);
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
};
