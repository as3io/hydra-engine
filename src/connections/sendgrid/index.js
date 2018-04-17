const sgMail = require('@sendgrid/mail');
const templateReset = require('./templates/reset.js');
const templateWelcome = require('./templates/welcome.js');
const templateInvitation = require('./templates/invitation.js');
const templateMagicLogin = require('./templates/magic-login.js');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const appUri = process.env.APP_URI;

const send = ({ to, subject, html }) => {
  const from = 'HYDRA Content Engine <noreply@hydra.as3.com>';
  const payload = {
    to,
    from,
    subject,
    html,
  };

  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'test') {
    return sgMail.send(payload);
  }
  return Promise.resolve(payload);
};

module.exports = {
  sendPasswordReset({
    email,
    familyName,
    givenName,
    token,
  }) {
    const link = `${appUri}/token/${token}/settings`;
    const subject = 'Your HYDRA password reset';
    const to = `${givenName} ${familyName} <${email}>`;
    const html = templateReset
      .replace('*|FIRST_NAME|*', givenName)
      .replace('*|LAST_NAME|*', familyName)
      .replace('*|VERIFY_LINK|*', link);
    return send({ to, subject, html });
  },

  sendMagicLogin({
    email,
    familyName,
    givenName,
    token,
  }) {
    const link = `${appUri}/token/${token}/index`;
    const subject = 'Your HYDRA magic login link';
    const to = `${givenName} ${familyName} <${email}>`;
    const html = templateMagicLogin
      .replace('*|FIRST_NAME|*', givenName)
      .replace('*|LAST_NAME|*', familyName)
      .replace('*|VERIFY_LINK|*', link);
    return send({ to, subject, html });
  },

  sendWelcomeVerification({
    email,
    familyName,
    givenName,
    token,
  }) {
    const link = `${appUri}/token/${token}/index`;
    const subject = 'Welcome to the HYDRA Content Engine';
    const to = `${givenName} ${familyName} <${email}>`;
    const html = templateWelcome
      .replace('*|FIRST_NAME|*', givenName)
      .replace('*|LAST_NAME|*', familyName)
      .replace('*|VERIFY_LINK|*', link);
    return send({ to, subject, html });
  },

  sendOrganizationInvitation({ name, photoURL }, { email, token }) {
    const link = `${appUri}/token/${token}/organization.accept`;
    const subject = `You have been invited to the ${name} organization on the HYDRA Content Engine`;
    const to = `${email}`;
    const html = templateInvitation
      .replace('*|ORGANIZATION_NAME|*', name)
      .replace('*|ORGANIZATION_PHOTOURL|*', photoURL)
      .replace('*|VERIFY_LINK|*', link);
    return send({ to, subject, html });
  },
};
