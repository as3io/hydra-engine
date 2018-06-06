require('../connections');
const TokenGenerator = require('../../src/factories/token-generator');
const Token = require('../../src/models/token');
const jwt = require('jsonwebtoken');

const sandbox = sinon.createSandbox();
const secret = 'some-secret';

describe('factories/token-generator', function() {
  it('should throw when no arguments are provided.', async function() {
    expect(() => TokenGenerator()).to.throw(Error, /^Unable to initialize the token/);
  });

  it('should error when a secret is not provided.', async function() {
    expect(() => TokenGenerator()).to.throw(Error, 'Unable to initialize the token generator: no value was provided for the secret.');
    expect(() => TokenGenerator({ secret: '' })).to.throw(Error, 'Unable to initialize the token generator: no value was provided for the secret.');
  });

  it('should apply the secret value to the object.', async function() {
    const generator = TokenGenerator({ secret });
    expect(generator.secret).to.equal(secret);
  });

  describe('#create', function() {
    const generator = TokenGenerator({ secret });

    beforeEach(async function() {
      await Token.remove();
      sandbox.spy(jwt, 'sign');
    });
    afterEach(async function() {
      sandbox.restore();
      await Token.remove();
    });

    it('should reject when no action is provded.', async function() {
      await expect(generator.create('', {}, 30)).to.be.rejectedWith(Error, 'Unable to create token: no action was provided.');
    });

    it('should create the token with the preset jti, iat, and exp values.', async function() {
      const promise = generator.create('some-action', { foo: 'bar' }, 30);
      await expect(promise).to.eventually.be.a('string');
      const token = await Token.findOne({ action: 'some-action' });
      expect(token).to.be.an('object');
      expect(token.payload).to.be.an('object');
      const { payload } = token;
      expect(payload.jti).to.be.a('string');
      expect(payload.iat).to.be.a('number');
      expect(payload.exp).to.be.a('number');
      expect(payload.exp).to.be.gt(payload.iat);
      expect(payload.foo).to.equal('bar');
    });

    it('should call the jwt sign method.', async function() {
      await generator.create('some-action', { foo: 'bar' }, 30);
      sinon.assert.calledOnce(jwt.sign);
    });

    it('should not set an exp value if the ttl is undefined.', async function() {
      const promise = generator.create('some-action');
      await expect(promise).to.eventually.be.a('string');
      const token = await Token.findOne({ action: 'some-action' });
      expect(token).to.be.an('object');
      expect(token.payload).to.be.an('object');
      const { payload } = token;
      expect(payload.exp).to.be.undefined;
    });

    it('should override the jti, iat, and exp values if passed in the payload.', async function() {
      const promise = generator.create('some-action', {
        foo: 'bar',
        iat: 100,
        exp: 400,
        jti: '1234',
      }, 40);
      await expect(promise).to.eventually.be.a('string');
      const token = await Token.findOne({ action: 'some-action' });
      expect(token).to.be.an('object');
      expect(token.payload).to.be.an('object');
      const { payload } = token;
      expect(payload.iat).to.equal(100);
      expect(payload.exp).to.equal(400);
      expect(payload.jti).to.equal('1234');
      expect(payload.foo).to.equal('bar');
    });
  });

  describe('#verify', function() {
    const generator = TokenGenerator({ secret });

    beforeEach(async function() {
      await Token.remove();
      sandbox.stub(jwt, 'verify').callsFake(() => 'token-value');
    });
    afterEach(async function() {
      sandbox.restore();
      await Token.remove();
    });

    it('should reject when no action is provded.', async function() {
      await expect(generator.verify('', 'some-token')).to.be.rejectedWith(Error, 'Unable to verify token: no action was provided.');
    });

    it('should reject when no encoded token is provded.', async function() {
      await expect(generator.verify('some-action', '')).to.be.rejectedWith(Error, 'Unable to verify token: no value was provided.');
    });

    it('should reject if the verified token cannot be found in the database.', async function() {
      await expect(generator.verify('some-action', 'some-token')).to.be.rejectedWith(Error, 'The provided token was either not found or is no longer valid.');
    });

    it('should verify the encoded token.', async function() {
      await generator.create('some-action', { foo: 'bar' }, 1000);
      await expect(generator.verify('some-action', 'token-value')).to.be.fulfilled;
      sinon.assert.calledOnce(jwt.verify);
      sinon.assert.calledWith(jwt.verify, 'token-value', 'some-secret', { algorithms: ['HS256'] });
    });

    it('should return the the token document from the database.', async function() {
      await generator.create('some-action', { foo: 'bar', jti: '1234' }, 1000);
      const promise = generator.verify('some-action', 'token-value');
      await expect(promise).to.be.fulfilled;
      const doc = await promise;
      expect(doc.action).to.equal('some-action');
      expect(doc.payload.jti).to.equal('1234');
    });
  });

  describe('#invalidate', function() {
    const generator = TokenGenerator({ secret });

    beforeEach(async function() {
      await Token.remove();
      sandbox.stub(jwt, 'verify').callsFake(() => 'token-value');
    });
    afterEach(async function() {
      sandbox.restore();
      await Token.remove();
    });

    it('should reject when no ID is provided.', async function() {
      await expect(generator.invalidate()).to.be.rejectedWith(Error, 'Unable to invalidate token: no ID was provided.');
    });

    it('should remove the token document from the database.', async function() {
      await generator.create('some-action', { foo: 'bar', jti: '1234' }, 1000);
      const doc = await generator.verify('some-action', 'token-value');
      await expect(generator.invalidate(doc.id)).to.be.fulfilled;
      await expect(Token.findById(doc.id)).to.eventually.be.null;
    });
  });

});
