require('../connections');
const bcrypt = require('bcrypt');
const userService = require('../../src/services/user');
const sessionService = require('../../src/services/session');

const sandbox = sinon.createSandbox();

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
    it('should be tested');
  });

  describe('#retrieveSession', function() {
    it('should be tested');
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
    it('should be tested');
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
    it('should be tested');
  });
});
