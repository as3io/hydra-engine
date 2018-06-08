const Session = require('../factories/session');
const env = require('../env');

const { SESSION_GLOBAL_SECRET, SESSION_NAMESPACE, SESSION_EXPIRATION } = env;

module.exports = Session({
  globalSecret: SESSION_GLOBAL_SECRET,
  namespace: SESSION_NAMESPACE,
  expires: SESSION_EXPIRATION,
});
