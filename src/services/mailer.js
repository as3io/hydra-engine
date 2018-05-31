const sgMail = require('@sendgrid/mail');
const emailTemplates = require('../email-templates');

const {
  SENDGRID_API_KEY,
  SENDGRID_FROM,
  SERVER_BASE_URI,
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
    const html = await emailTemplates.render('organization-invite', {
      organization,
      user,
      verifyUrl: `${SERVER_BASE_URI}/actions/organization-invite/${token}`,
    });
    const { givenName, familyName, email } = user;
    const { name } = organization;

    const to = `${givenName} ${familyName} <${email}>`;
    const subject = `You have been invited to the ${name} organization.`;
    return this.send({ to, subject, html });
  },
};
