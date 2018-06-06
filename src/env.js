const { isURL, isUUID } = require('validator');

const {
  cleanEnv,
  makeValidator,
  port,
  bool,
  url,
  num,
} = require('envalid');

const mongodsn = makeValidator((v) => {
  const opts = { protocols: ['mongodb'], require_tld: false, require_protocol: true };
  if (isURL(v, opts)) return v;
  throw new Error('Expected a Mongo DSN string with mongodb://');
});

const redisdsn = makeValidator((v) => {
  const opts = { protocols: ['redis'], require_tld: false, require_protocol: true };
  if (isURL(v, opts)) return v;
  throw new Error('Expected a Redis DSN string with redis://');
});

const nonemptystr = makeValidator((v) => {
  const err = new Error('Expected a non-empty string');
  if (v === undefined || v === null || v === '') {
    throw err;
  }
  const trimmed = String(v).trim();
  if (!trimmed) throw err;
  return trimmed;
});

const uuid = makeValidator((v) => {
  if (isUUID(v)) return v;
  throw new Error('Expected a UUID string');
});

module.exports = cleanEnv(process.env, {
  PORT: port({ desc: 'The port that express will run on.' }),

  APP_NAME: nonemptystr({ desc: 'The application name. Will appear in email notifications, templates, etc.' }),
  BASE_URI_APP: url({ desc: 'The base URL/URI for the frontend application. Is used for generating links to the fronted.' }),
  BASE_URI_SERVER: url({ desc: 'The base URL/URI for the backend server. Is used for generating links to the server/api.' }),

  MONGO_DSN: mongodsn({ desc: 'The MongoDB DSN to connect to.' }),
  REDIS_DSN: redisdsn({ desc: 'The Redis DSN to connect to.' }),
  MONGOOSE_DEBUG: bool({ desc: 'Whether to enable Mongoose debugging.', default: false }),

  JWT_SECRET: nonemptystr({ desc: 'The secret to use when signing JWTs via the token generator service.', devDefault: 'not-an-actual-secret' }),

  SENDGRID_API_KEY: nonemptystr({ desc: 'The SendGrid API key for sending email.' }),
  SENDGRID_FROM: nonemptystr({ desc: 'The from name to use when sending email via SendGrid, e.g. Foo <foo@bar.com>' }),

  SESSION_GLOBAL_SECRET: nonemptystr({ desc: 'The global secret to use when creating user sessions.', devDefault: 'not-an-actual-secret' }),
  SESSION_NAMESPACE: uuid({ desc: 'The user session namespace value. Must be a UUID.', devDefault: '00000000-0000-4000-0000-000000000000' }),
  SESSION_EXPIRATION: num({ desc: 'The session expiration time, in seconds.', devDefault: 86400 }),

  NEW_RELIC_ENABLED: bool({ desc: 'Whether New Relic is enabled.', default: true, devDefault: false }),
  NEW_RELIC_LICENSE_KEY: nonemptystr({ desc: 'The license key for New Relic.', devDefault: '(unset)' }),
}, { strict: true });
