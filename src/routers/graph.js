const { Router } = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const passport = require('passport');
const { graphqlExpress } = require('apollo-server-express');
const Auth = require('../classes/auth');
const Tenant = require('../classes/tenant');
const schema = require('../graph/schema');

/**
 * Authenticates a user via the `Authorization: Bearer` JWT.
 * If credentaials are present and valid, will add the `user` and `session`
 * context to `req.auth`.
 *
 * If the request is anonymous (no credentials provided), or the credentials
 * are invalid, an error is _not_ thrown. Instead, the `user` and `session`
 * contexts on `req.auth` are left `undefined` and, additionally, the `err` context is
 * added with the `Error` that was generated. It is possible for the `err` to be `null`,
 * in the case of anonymous users (e.g. `{ user: undefined, session: undefind, err: null }`).
 *
 * Ulitimately, it will be up to the underlying Graph API, and the services
 * it uses, to determine when/if to throw authentication or authorization errors,
 * based on the specific graph action being performed.
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
const authenticate = (req, res, next) => {
  passport.authenticate('bearer', { session: false }, (err, { user, session } = {}) => {
    const { tenant } = req;
    req.auth = new Auth({
      user,
      session,
      tenant,
      err,
    });
    next();
  })(req, res, next);
};

const loadTenancy = (req, res, next) => {
  req.tenant = new Tenant({
    organizationId: req.get('X-Organization'),
    projectId: req.get('X-Project'),
  });
  next();
};

const router = Router();

router.use(
  helmet(),
  loadTenancy,
  authenticate,
  bodyParser.json(),
  graphqlExpress((req) => {
    const { auth } = req;
    return { schema, context: { auth } };
  }),
);

module.exports = router;
