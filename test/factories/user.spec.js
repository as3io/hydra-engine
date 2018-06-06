require('../connections');
const bcrypt = require('bcrypt');
const UserService = require('../../src/factories/user');
const sessionService = require('../../src/services/session');
const mailer = require('../../src/services/mailer');
const tokenGenerator = require('../../src/services/token-generator');
const User = require('../../src/models/user');
const Seed = require('../../src/fixtures/seed');

const userService = UserService();

const sandbox = sinon.createSandbox();

const stubBcryptHash = () => sandbox.stub(bcrypt, 'hash').resolves('$2a$04$jdkrJXkU92FIF4NcprNKWOcMKoOG28ELDrW2HBpDZFSmY/vxOj4VW');

describe('factories/user', function() {
  describe('#login', function() {
    let user;
    beforeEach(async function() {
      stubBcryptHash();
      user = await Seed.users(1);
      sandbox.stub(userService, 'sendMagicLoginEmail').resolves();
      sandbox.stub(userService, 'verifyPassword').resolves();
      sandbox.stub(userService, 'updateLoginInfo').resolves();
      sandbox.spy(sessionService, 'set');
    });
    afterEach(async function() {
      await User.remove();
      sandbox.restore();
    });

    it('should reject when no password is provided.', async function() {
      await expect(userService.login(user.email)).to.be.rejectedWith(Error, 'Unable to login user. No password was provided.');
      sandbox.assert.notCalled(userService.sendMagicLoginEmail);
      sandbox.assert.notCalled(userService.verifyPassword);
      sandbox.assert.notCalled(sessionService.set);
      sandbox.assert.notCalled(userService.updateLoginInfo);
    });
    it('should reject when no user could be found for the provided email address.', async function() {
      await expect(userService.login('bademail', 'some-password')).to.be.rejectedWith(Error, 'No user was found for the provided email address.');
      sandbox.assert.notCalled(userService.sendMagicLoginEmail);
      sandbox.assert.notCalled(userService.verifyPassword);
      sandbox.assert.notCalled(sessionService.set);
      sandbox.assert.notCalled(userService.updateLoginInfo);
    });
    it('should reject and send a magic link login email when no password has been set.', async function() {
      user.password = undefined;
      await user.save();
      await expect(userService.login(user.email, 'some-password')).to.be.rejectedWith(Error, 'A password has not yet been set. An email has been sent providing further instructions.');
      sandbox.assert.calledOnce(userService.sendMagicLoginEmail);
      sandbox.assert.calledWith(userService.sendMagicLoginEmail, user.email);
      sandbox.assert.notCalled(userService.verifyPassword);
      sandbox.assert.notCalled(sessionService.set);
      sandbox.assert.notCalled(userService.updateLoginInfo);
    });
    it('should verify the password.', async function() {
      await expect(userService.login(user.email, 'some-password')).to.be.fulfilled;
      sandbox.assert.calledOnce(userService.verifyPassword);
      sandbox.assert.calledWith(userService.verifyPassword, 'some-password', user.password);
    });
    it('should create the user session.', async function() {
      await expect(userService.login(user.email, 'some-password')).to.be.fulfilled;
      sandbox.assert.calledOnce(sessionService.set);
      sandbox.assert.calledWith(sessionService.set, user.id);
    });
    it('should update the user login info.', async function() {
      await expect(userService.login(user.email, 'some-password')).to.be.fulfilled;
      sandbox.assert.calledOnce(userService.updateLoginInfo);
    });
    it('should return the user and session object.', async function() {
      await expect(userService.login(user.email, 'some-password')).to.eventually.be.an('object').with.all.keys(['user', 'session']);
      sandbox.assert.notCalled(userService.sendMagicLoginEmail);
    });
  });

  describe('#loginWithApiKey', function() {
    let user;
    beforeEach(async function() {
      stubBcryptHash();
      user = await Seed.users(1);
      user.set('api', { key: 'foo', secret: 'bar' });
      await user.save();
      sandbox.spy(sessionService, 'set');
    });
    afterEach(async function() {
      await User.remove();
      sandbox.restore();
    });
    it('should reject when the user cannot be found by key.', async function() {
      await expect(userService.loginWithApiKey('bad-key')).to.be.rejectedWith(Error, 'No user was found for the provided API key.');
      sandbox.assert.notCalled(sessionService.set);
    });
    it('should reject when the secret is provided by does not match the user secret.', async function() {
      await expect(userService.loginWithApiKey('foo', 'bad-secret')).to.be.rejectedWith(Error, 'The provided API secret is invalid.');
      sandbox.assert.notCalled(sessionService.set);
    });
    it('should create the session with the API credentials with a secret.', async function() {
      await expect(userService.loginWithApiKey('foo', 'bar')).to.eventually.be.an('object').with.all.keys(['user', 'session']);
      sandbox.assert.calledOnce(sessionService.set);
      sandbox.assert.calledWith(sessionService.set, user.id, { key: 'foo', secret: 'bar' });
    });
    it('should create the session with the API credentials without a secret.', async function() {
      await expect(userService.loginWithApiKey('foo')).to.eventually.be.an('object').with.all.keys(['user', 'session']);
      sandbox.assert.calledOnce(sessionService.set);
      sandbox.assert.calledWith(sessionService.set, user.id, { key: 'foo', secret: undefined });
    });
  });

  describe('#loginWithMagicToken', function() {
    let user;
    beforeEach(async function() {
      stubBcryptHash();
      user = await Seed.users(1);
      sandbox.stub(tokenGenerator, 'verify').resolves({ id: 'token-id', payload: { uid: user.id } });
      sandbox.stub(tokenGenerator, 'invalidate').resolves();
      sandbox.spy(userService, 'updateLoginInfo');
      sandbox.spy(sessionService, 'set');
    });
    afterEach(async function() {
      await User.remove();
      sandbox.restore();
    });

    it('should reject when the user cannot be found.', async function() {
      await User.remove({ _id: user.id });
      await expect(userService.loginWithMagicToken('some-token')).to.be.rejectedWith(Error, 'No user was found for the provided token.');
      sandbox.assert.calledOnce(tokenGenerator.verify);
      sandbox.assert.calledWith(tokenGenerator.verify, 'magic-login', 'some-token');
      sandbox.assert.notCalled(sessionService.set);
      sandbox.assert.notCalled(tokenGenerator.invalidate);
      sandbox.assert.notCalled(userService.updateLoginInfo);
    });
    it('should set the session on success.', async function() {
      await expect(userService.loginWithMagicToken('some-token')).to.eventually.be.an('object').with.all.keys(['user', 'session']);
      sandbox.assert.calledOnce(sessionService.set);
      sandbox.assert.calledWith(sessionService.set, user.id);
    });
    it('should update the user login info on success.', async function() {
      await expect(userService.loginWithMagicToken('some-token')).to.eventually.be.an('object');
      sandbox.assert.calledOnce(userService.updateLoginInfo);
    });
    it('should invlidate the token on success.', async function() {
      await expect(userService.loginWithMagicToken('some-token')).to.eventually.be.an('object');
      sandbox.assert.calledOnce(tokenGenerator.invalidate);
      sandbox.assert.calledWith(tokenGenerator.invalidate, 'token-id');
    });
    it('should set the user email as verified.', async function() {
      user.emailVerified = false;
      await user.save();
      const result = await userService.loginWithMagicToken('some-token');
      expect(result.user.id.toString()).to.equal(user.id.toString());
      expect(result.user.emailVerified).to.be.true;
    });

  });

  describe('#createMagicLoginToken', function() {
    beforeEach(async function() {
      sandbox.stub(tokenGenerator, 'create').resolves('some-token-value');
    });
    afterEach(async function() {
      sandbox.restore();
    });
    it('should create the token.', async function() {
      await expect(userService.createMagicLoginToken({ id: '1234' })).to.eventually.equal('some-token-value');
      sandbox.assert.calledOnce(tokenGenerator.create);
      sandbox.assert.calledWith(tokenGenerator.create, 'magic-login', { uid: '1234' }, 3600);
    });
  });

  describe('#sendMagicLoginEmail', function() {
    let user;
    beforeEach(async function() {
      stubBcryptHash();
      user = await Seed.users(1);
      sandbox.stub(userService, 'createMagicLoginToken').resolves('some-token-value');
      sandbox.stub(mailer, 'sendMagicLogin').resolves();
    });
    afterEach(async function() {
      await User.remove();
      sandbox.restore();
    });
    it('should resolve to true even when the user is not found, but not send the email.', async function() {
      await User.remove({ _id: user.id });
      await expect(userService.sendMagicLoginEmail(user.email)).to.eventually.be.true;
      sandbox.assert.notCalled(userService.createMagicLoginToken);
      sandbox.assert.notCalled(mailer.sendMagicLogin);
    });
    it('should create the login token and send the email.', async function() {
      await expect(userService.sendMagicLoginEmail(user.email)).to.eventually.be.true;
      sandbox.assert.calledOnce(userService.createMagicLoginToken);
      sandbox.assert.calledWith(userService.createMagicLoginToken, sinon.match.object);
      sandbox.assert.calledOnce(mailer.sendMagicLogin);
      sandbox.assert.calledWith(mailer.sendMagicLogin, sinon.match.object, 'some-token-value');
    });
  });

  describe('#resetPassword', function() {
    let user;
    beforeEach(async function() {
      stubBcryptHash();
      user = await Seed.users(1);
      sandbox.stub(tokenGenerator, 'verify').resolves({ id: '1234', payload: { uid: user.id } });
      sandbox.stub(tokenGenerator, 'invalidate').resolves();
      sandbox.spy(User.prototype, 'save');
      sandbox.spy(User.prototype, 'set');
    });
    afterEach(async function() {
      await User.remove();
      sandbox.restore();
    });
    it('should verify the JWT token and invalidate when successful.', async function() {
      await expect(userService.resetPassword('some-token', 'new-password')).to.fulfilled;
      sandbox.assert.calledOnce(tokenGenerator.verify);
      sandbox.assert.calledWith(tokenGenerator.verify, 'password-reset', 'some-token');
      sandbox.assert.calledOnce(tokenGenerator.invalidate);
      sandbox.assert.calledWith(tokenGenerator.invalidate, '1234');
    });
    it('should reject when no user can be found.', async function() {
      await User.remove({ _id: user.id });
      await expect(userService.resetPassword('some-token', 'new-password')).to.be.rejectedWith(Error, 'No user was found for the provided token.');
    });
    it('should reset the password.', async function() {
      const promise = userService.resetPassword('some-token', 'new-password');
      await expect(promise).to.eventually.be.an('object');
      const result = await promise;
      sandbox.assert.calledOnce(User.prototype.save);
      sandbox.assert.calledWith(User.prototype.set, 'password', 'new-password');
      expect(result.password).to.equal('$2a$04$jdkrJXkU92FIF4NcprNKWOcMKoOG28ELDrW2HBpDZFSmY/vxOj4VW');
    });
  });

  describe('#sendWelcomeVerification', function() {
    let user;
    beforeEach(async function() {
      stubBcryptHash();
      user = await Seed.users(1);
      sandbox.stub(userService, 'createMagicLoginToken').resolves('a-token-value');
      sandbox.stub(mailer, 'sendWelcomeVerification').resolves();
    });
    afterEach(async function() {
      await User.remove();
      sandbox.restore();
    });
    it('should send the welcome verification email.', async function() {
      await expect(userService.sendWelcomeVerification(user)).to.be.fulfilled;
      sandbox.assert.calledOnce(userService.createMagicLoginToken);
      sandbox.assert.calledOnce(mailer.sendWelcomeVerification);
      sandbox.assert.calledWith(mailer.sendWelcomeVerification, sinon.match.object, 'a-token-value');
    });
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
