require('../connections');
const jwt = require('jsonwebtoken');
const sessionService = require('../../src/services/session');
const uuid = require('../../src/utils/wrap-uuid');
const redis = require('../../src/connections/redis');

const sandbox = sinon.createSandbox();

describe('services/session', function() {
  beforeEach(async function() {
    const vars = {
      SESSION_GLOBAL_SECRET: 'areallygoodglobalsecret',
      SESSION_NAMESPACE: '139ec234-0c43-4629-a7bf-689549615721',
      SESSION_EXPIRATION: 3600,
    };
    Object.keys(vars).forEach(key => process.env[key] = vars[key]);
    sandbox.spy(uuid, 'v5');
  });
  afterEach(async function() {
    sandbox.restore();
  });

  describe('.globalSecret', function() {
    it('should throw an error when the SESSION_GLOBAL_SECRET value is not set', async function() {
      delete process.env.SESSION_GLOBAL_SECRET;
      expect(() => sessionService.globalSecret).to.throw(Error, 'No value was provided for the SESSION_GLOBAL_SECRET');
    });
  });

  describe('.namespace', function() {
    it('should throw an error when the SESSION_NAMESPACE value is not set', async function() {
      delete process.env.SESSION_NAMESPACE;
      expect(() => sessionService.namespace).to.throw(Error, 'An invalid value was provided for the SESSION_NAMESPACE');
    });
    it('should throw an error when the SESSION_NAMESPACE value is not a UUID.', async function() {
      process.env.SESSION_NAMESPACE = 'some-bad-value';
      expect(() => sessionService.namespace).to.throw(Error, 'An invalid value was provided for the SESSION_NAMESPACE');
    });
  });

  describe('.expires', function() {
    it('should throw an error when the SESSION_EXPIRATION value is not set', async function() {
      delete process.env.SESSION_EXPIRATION;
      expect(() => sessionService.expires).to.throw(Error, 'No value was provided for the SESSION_EXPIRATION');
    });
  });

  describe('#createSessionId', function() {
    it('should return a UUID.', async function() {
      const id = sessionService.createSessionId('1234', 1200);
      expect(id).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
    it('should generate the UUID with the namespace.', async function() {
      const id = sessionService.createSessionId('1234', 1200);
      sandbox.assert.calledOnce(uuid.v5);
      sandbox.assert.calledWith(uuid.v5, '1234.1200', process.env.SESSION_NAMESPACE);
    });
  });

  describe('#createSecret', function() {
    it('should create the secret by merging the user and global secrets.', async function() {
      const id = sessionService.createSecret('mysecret');
      expect(id).to.equal(`mysecret.${process.env.SESSION_GLOBAL_SECRET}`);
    });
  });

  describe('#prefixSessionId', function() {
    it('should create the prefix.', async function() {
      const id = sessionService.prefixSessionId('1234');
      expect(id).to.equal('session:id:1234');
    });
  });

  describe('#prefixUserId', function() {
    it('should create the prefix.', async function() {
      const id = sessionService.prefixUserId('1234');
      expect(id).to.equal('session:uid:1234');
    });
  });

  describe('#set', function() {
    let sid;
    beforeEach(async function() {
      sid = uuid.v4();
      sandbox.stub(sessionService, 'createSessionId').callsFake(() => sid);
      sandbox.stub(jwt, 'sign').callsFake(() => 'some-token-value');
      sandbox.spy(redis, 'saddAsync');
      sandbox.spy(redis, 'expireAsync');
      sandbox.spy(redis, 'setexAsync');
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should reject when no uid is provided.', async function() {
      await expect(sessionService.set()).to.be.rejectedWith(Error, 'Unable to set session: no user ID was provided.');
    });
    it('should sign the token.', async function() {
      await sessionService.set('1234');
      sandbox.assert.calledOnce(jwt.sign);
    });
    it('should set the session to redis.', async function() {
      await sessionService.set('1234');
      const id = `session:id:${sid}`;
      const result = await redis.getAsync(id);
      expect(result).to.be.a('string');
      const parsed = JSON.parse(result);
      expect(parsed.id).to.equal(sid);
      expect(parsed.uid).to.equal('1234');
      expect(parsed).to.have.all.keys(['id', 'ts', 'uid', 's']);
      sandbox.assert.calledOnce(redis.setexAsync);
      sandbox.assert.calledWith(redis.setexAsync, id, process.env.SESSION_EXPIRATION, sinon.match.string);
    });
    it('should add the user id to the redis user set.', async function() {
      const uid = '1234';
      const memberKey = `session:uid:${uid}`;
      await sessionService.set(uid);
      sandbox.assert.calledOnce(redis.saddAsync);
      sandbox.assert.calledWith(redis.saddAsync, memberKey, sid);
      sandbox.assert.calledOnce(redis.expireAsync);
      sandbox.assert.calledWith(redis.expireAsync, memberKey, process.env.SESSION_EXPIRATION);
    });
    it('should return a session object.', async function() {
      const uid = '1234';
      const promise = sessionService.set(uid);
      await expect(promise).to.eventually.be.an('object');
      const session = await promise;
      expect(session).to.have.all.keys(['id', 'uid', 'cre', 'exp', 'token', 'api']);
      expect(session.id).to.equal(sid);
      expect(session.uid).to.equal(uid);
      expect(session.token).to.equal('some-token-value');
      expect(session.api).to.be.undefined;
    });
    it('should return a session object with api credentials when passed.', async function() {
      const uid = '1234';
      const api = { key: 'foo', secret: 'bar' };
      const promise = sessionService.set(uid, api);
      await expect(promise).to.eventually.be.an('object');
      const session = await promise;
      expect(session).to.have.all.keys(['id', 'uid', 'cre', 'exp', 'token', 'api']);
      expect(session.api).to.deep.equal(api);
    });
  });
});
