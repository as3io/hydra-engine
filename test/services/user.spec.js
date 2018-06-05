require('../connections');
const bcrypt = require('bcrypt');
const userService = require('../../src/services/user');
const sessionService = require('../../src/services/session');
const mailer = require('../../src/services/mailer');
const tokenGenerator = require('../../src/services/token-generator');
const User = require('../../src/models/user');
const Seed = require('../../src/fixtures/seed');

const sandbox = sinon.createSandbox();

const stubBcryptHash = () => sandbox.stub(bcrypt, 'hash').resolves('$2a$04$jdkrJXkU92FIF4NcprNKWOcMKoOG28ELDrW2HBpDZFSmY/vxOj4VW');

describe('services/user', function() {
  describe('#login', function() {
    it('should be tested');
  });

  describe('#loginWithApiKey', function() {
    it('should be tested');
  });

  describe('#loginWithMagicToken', function() {
    it('should be tested');
  });

  describe('#createMagicLoginToken', function() {
    it('should be tested');
  });

  describe('#sendMagicLoginEmail', function() {
    it('should be tested');
  });

  describe('#resetPassword', function() {
    it('should be tested');
  });

  describe('#setCurrentUserPassword', function() {
    it('should be tested');
  });

  describe('#sendWelcomeVerification', function() {
    it('should be tested');
  });

  describe('#sendPasswordResetEmail', function() {
    let user;
    beforeEach(async function() {
      stubBcryptHash();
      user = await Seed.users(1);
      sandbox.spy(tokenGenerator, 'create');
      sandbox.stub(mailer, 'sendPasswordReset').resolves();
    });
    afterEach(async function() {
      await User.remove();
      sandbox.restore();
    });
    it('should return true, but not send an email when the user cannot be found.', async function() {
      await expect(userService.sendPasswordResetEmail('some bad email')).to.eventually.be.true;
      sandbox.assert.notCalled(tokenGenerator.create);
      sandbox.assert.notCalled(mailer.sendPasswordReset);
    });
    it('should send the password reset email.', async function() {
      await expect(userService.sendPasswordResetEmail(user.email)).to.eventually.be.true;
      sandbox.assert.calledOnce(tokenGenerator.create);
      sandbox.assert.calledWith(tokenGenerator.create, 'password-reset', { uid: user.id }, 3600);
      sandbox.assert.calledOnce(mailer.sendPasswordReset);
      const token = await tokenGenerator.create.returnValues[0];
      sandbox.assert.calledWith(mailer.sendPasswordReset, sinon.match.object, token);
    });
  });

  describe('#retrieveSession', function() {
    let user;
    beforeEach(async function() {
      stubBcryptHash();
      user = await Seed.users(1);
      sandbox.stub(sessionService, 'get')
        .withArgs('token-value').resolves({ uid: user.id })
        .withArgs('token-value-with-api').resolves({ uid: user.id, api: user.api })
      ;
      sandbox.stub(userService, 'checkApiCredentials').callsFake(() => true);
    });
    afterEach(async function() {
      await User.remove();
      sandbox.restore();
    });

    it('should reject when the user can no longer be found.', async function() {
      await User.remove({ _id: user.id });
      await expect(userService.retrieveSession('token-value')).to.be.rejectedWith(Error, 'Unable to retrieve session: the provided user could not be found.');
      sandbox.assert.calledOnce(sessionService.get);
      sandbox.assert.calledWith(sessionService.get, 'token-value');
    });

    it('should return the user and session objects.', async function() {
      const promise = userService.retrieveSession('token-value');
      await expect(promise).to.eventually.be.an('object').with.all.keys(['user', 'session']);
      const result = await promise;
      expect(result.user.id.toString()).to.equal(user.id.toString());
      expect(result.session.uid.toString()).to.equal(user.id.toString());
    });

    it('should should not check for api credentials when not in the session.', async function() {
      const promise = userService.retrieveSession('token-value');
      await expect(promise).to.be.fulfilled;
      sandbox.assert.notCalled(userService.checkApiCredentials);
    });

    it('should should check for api credentials when in the session.', async function() {
      const promise = userService.retrieveSession('token-value-with-api');
      await expect(promise).to.be.fulfilled;
      sandbox.assert.calledOnce(userService.checkApiCredentials);
    });
  });

  describe('#deleteSession', function() {
    beforeEach(async function() {
      sandbox.spy(sessionService, 'delete');
    });
    afterEach(async function() {
      sandbox.restore();
    });
    it('should call the session service.', async function() {
      await userService.deleteSession('1234', '5678');
      sandbox.assert.calledOnce(sessionService.delete);
      sandbox.assert.calledWith(sessionService.delete, '1234', '5678');
    });
  });

  describe('#checkApiCredentials', function() {
    it('should throw when the API key changes.', async function() {
      const credentials = { key: '1234' };
      const user = new User({ api: { key: '5678' } });
      expect(() => userService.checkApiCredentials(credentials, user)).to.throw(Error, 'The provided API key is no longer valid.');
    });
    it('should throw when the API key is not set on the user.', async function() {
      const credentials = { key: '1234' };
      const user = new User();
      expect(() => userService.checkApiCredentials(credentials, user)).to.throw(Error, 'The provided API key is no longer valid.');
    });
    it('should pass when the keys match and no secret is provided.', async function() {
      const credentials = { key: '1234' };
      const user = new User({ api: { key: '1234', secret: 'abc' } });
      expect(userService.checkApiCredentials(credentials, user)).to.equal(true);
    });
    it('should throw when the keys match but the secrets are different.', async function() {
      const credentials = { key: '1234', secret: '987' };
      const user = new User({ api: { key: '1234', secret: 'abc' } });
      expect(() => userService.checkApiCredentials(credentials, user)).to.throw(Error, 'The provided API secret is no longer valid.');
    });
  });

  describe('#verifyPassword', function() {
    const clear = 'test-password';
    let encoded;
    beforeEach(async function() {
      encoded = await bcrypt.hash(clear, 2);
    });

    it('should reject when the cleartext password is wrong.', async function() {
      await expect(userService.verifyPassword('bad-pass', encoded)).to.be.rejectedWith(Error, 'The provided password was incorrect.');
    });
    it('should fulfill when the cleartext password is correct.', async function() {
      await expect(userService.verifyPassword(clear, encoded)).to.eventually.be.true;
    });
  });

  describe('#updateLoginInfo', function() {
    before(async function() {
      stubBcryptHash();
    });
    after(async function() {
      await User.remove();
      sandbox.restore();
    });
    it('should updated the user login fields.', async function() {
      const user = await Seed.users(1);
      user.set({
        logins: 0,
        lastLoggedInAt: undefined,
      })
      await user.save();
      const promise = userService.updateLoginInfo(user);
      await expect(promise).to.eventually.be.an('object');
      const result = await promise;
      expect(result.logins).to.equal(1);
      expect(result.lastLoggedInAt).to.be.an.instanceOf(Date);
    });
  });
});
