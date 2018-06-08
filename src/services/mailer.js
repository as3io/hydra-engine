const Mailer = require('../factories/mailer');
const env = require('../env');

const {
  SENDGRID_API_KEY,
  SENDGRID_FROM,
  BASE_URI_APP,
  APP_NAME,
} = env;

module.exports = Mailer({
  appName: APP_NAME,
  baseURI: BASE_URI_APP,
  fromAddress: SENDGRID_FROM,
  apiKey: SENDGRID_API_KEY,
});
