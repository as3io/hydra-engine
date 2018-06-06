require('../connections');
const jwt = require('jsonwebtoken');
const Session = require('../../src/factories/session');
const uuid = require('../../src/utils/wrap-uuid');
const redis = require('../../src/connections/redis');

const sessionService = Session({
  globalSecret: 'areallygoodglobalsecret',
  namespace: '139ec234-0c43-4629-a7bf-689549615721',
  expires: 3600,
});
const sandbox = sinon.createSandbox();

describe('factories/session', function() {
  it('should throw when no arguments are provided.', async function() {
    expect(() => Session()).to.throw(Error, /^Unable to initialize the session/);
  });
  it('should throw when no global secret is provided.', async function() {
    expect(() => Session({
      namespace: '139ec234-0c43-4629-a7bf-689549615721',
      expires: 3600,
    })).to.throw(Error, 'Unable to initialize the session: no value was provided for the global secret.');
  });
  it('should throw the namespace is not provided.', async function() {
    expect(() => Session({
      globalSecret: 'areallygoodglobalsecret',
      expires: 3600,
    })).to.throw(Error, 'Unable to initialize the session: an invalid value was provided for the namespace.');
  });
  it('should throw the namespace is at UUID.', async function() {
    expect(() => Session({
      globalSecret: 'areallygoodglobalsecret',
      namespace: 'not-a-uuid',
      expires: 3600,
    })).to.throw(Error, 'Unable to initialize the session: an invalid value was provided for the namespace.');
  });
  it('should throw when no expiration is provided.', async function() {
    expect(() => Session({
      globalSecret: 'areallygoodglobalsecret',
      namespace: '139ec234-0c43-4629-a7bf-689549615721',
    })).to.throw(Error, 'Unable to initialize the session: no value was provided for the session expiration.');
  });

  describe('#createSessionId', function() {
    beforeEach(async function() {
      sandbox.spy(uuid, 'v5');
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should return a UUID.', async function() {
      const id = sessionService.createSessionId('1234', 1200);
      expect(id).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
    it('should generate the UUID with the namespace.', async function() {
      const id = sessionService.createSessionId('1234', 1200);
      sandbox.assert.calledOnce(uuid.v5);
      sandbox.assert.calledWith(uuid.v5, '1234.1200', '139ec234-0c43-4629-a7bf-689549615721');
    });
  });

  describe('#createSecret', function() {
    it('should create the secret by merging the user and global secrets.', async function() {
      const id = sessionService.createSecret('mysecret');
      expect(id).to.equal('mysecret.areallygoodglobalsecret');
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
      sandbox.assert.calledWith(redis.setexAsync, id, 3600, sinon.match.string);
    });
    it('should add the user id to the redis user set.', async function() {
      const uid = '1234';
      const memberKey = `session:uid:${uid}`;
      await sessionService.set(uid);
      sandbox.assert.calledOnce(redis.saddAsync);
      sandbox.assert.calledWith(redis.saddAsync, memberKey, sid);
      sandbox.assert.calledOnce(redis.expireAsync);
      sandbox.assert.calledWith(redis.expireAsync, memberKey, 3600);
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

  describe('#get', function() {
    let sid;
    beforeEach(async function() {
      sid = uuid.v4();
      sandbox.stub(sessionService, 'createSessionId').callsFake(() => sid);
      sandbox.stub(jwt, 'verify').callsFake(() => ({
        iat: 12345,
        exp: 67890,
      }));
    });
    afterEach(async function() {
      sandbox.restore();
    });
    it('should reject when no token is provided.', async function() {
      await expect(sessionService.get()).to.be.rejectedWith(Error, 'Unable to get session: no token was provided.');
    });
    it('should reject when the token is improperly formatted.', async function() {
      await expect(sessionService.get('badformat')).to.be.rejectedWith(Error, 'Unable to get session: invalid token format.');
    });
    it('should reject when no token could be found.', async function() {
      const { id, token } = await sessionService.set('1234');
      await redis.delAsync(`session:id:${id}`);
      await expect(sessionService.get(token)).to.be.rejectedWith('Unable to get session: no token found in storage.');
    });
    it('should verify the token.', async function() {
      const { token } = await sessionService.set('1234');
      await expect(sessionService.get(token)).to.be.fulfilled;
      sandbox.assert.calledOnce(jwt.verify);
      sandbox.assert.calledWith(jwt.verify, token);
    });
    it('should return the session data.', async function() {
      const { token } = await sessionService.set('1234');
      const promise = sessionService.get(token);
      await expect(promise).to.eventually.be.an('object');
      const session = await promise;
      expect(session).to.have.all.keys(['id', 'uid', 'cre', 'exp', 'api', 'token']);
      expect(session.id).to.equal(sid);
      expect(session.uid).to.equal('1234');
      expect(session.cre).to.equal(12345);
      expect(session.exp).to.equal(67890);
      expect(session.api).to.be.undefined;
      expect(session.token).to.equal(token);
    });
  });

  describe('#delete', function() {
    beforeEach(async function() {
      sandbox.spy(redis, 'delAsync');
      sandbox.spy(redis, 'sremAsync');
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should reject when no id is provided.', async function() {
      await expect(sessionService.delete()).to.be.rejectedWith(Error, 'Unable to delete session: both a session and user ID are required.');
    });
    it('should reject when no uid is provided.', async function() {
      await expect(sessionService.delete('1234')).to.be.rejectedWith(Error, 'Unable to delete session: both a session and user ID are required.');
    });
    it('should deleted the session data from redis.', async function() {
      const id = '1234';
      const uid = '5678';

      await sessionService.delete(id, uid);
      sandbox.assert.calledOnce(redis.delAsync);
      sandbox.assert.calledWith(redis.delAsync, `session:id:${id}`);
      sandbox.assert.calledOnce(redis.sremAsync);
      sandbox.assert.calledWith(redis.sremAsync, `session:uid:${uid}`, id);
    });
  });
});
