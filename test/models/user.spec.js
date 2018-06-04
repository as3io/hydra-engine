require('../connections');
const bcrypt = require('bcrypt');
const User = require('../../src/models/user');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField } = require('./utils');
const sandbox = sinon.createSandbox();

const bcryptRegex = /^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9\.\/]{53}$/;
const generateUser = () => fixtures(User, 1).one();

describe('models/user', function() {
  before(async function() {
    await User.remove();
  });

  let user;
  beforeEach(function() {
    sandbox.stub(bcrypt, 'hash').resolves('$2a$04$jdkrJXkU92FIF4NcprNKWOcMKoOG28ELDrW2HBpDZFSmY/vxOj4VW');
    user = generateUser();
  });
  afterEach(async function() {
    await User.remove();
    sandbox.restore();
  });

  it('should successfully save.', async () => {
    await expect(user.save()).to.be.fulfilled;
  });

  describe('.email', function() {
    it('should be trimmed.', function() {
      return testTrimmedField(user, 'email', { value: ' foo@bar.com  ', expected: 'foo@bar.com' });
    });
    ['', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(user, 'email', value);
      });
    });
    it('should be unique.', function() {
      const another = generateUser();
      return testUniqueField(user, another, 'email', 'some@email.com');
    });
    it('should be lowercased', async function() {
      user.set('email', 'Foo@Bar.net');
      await expect(user.save()).to.be.fulfilled;
      await expect(User.findOne({ _id: user.id })).to.eventually.have.property('email').equal('foo@bar.net');
    });
    ['some val', 'some@val', 'some@@email.net', '@yahoo.com'].forEach((value) => {
      it(`should be a valid email address and be rejected when the value is '${value}'`, async function() {
        user.set('email', value);
        await expect(user.save()).to.be.rejectedWith(Error, /invalid email address/i);
      });
    });
  });

  describe('.givenName', function() {
    it('should be trimmed.', function() {
      return testTrimmedField(user, 'givenName');
    });
    ['', ' ', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(user, 'givenName', value);
      });
    });
  });

  describe('.familyName', function() {
    it('should be trimmed.', function() {
      return testTrimmedField(user, 'familyName');
    });
    ['', ' ', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(user, 'familyName', value);
      });
    });
  });

  describe('.password', function() {
    it('should require a min length of 6.', async function() {
      user.set('password', '12345');
      await expect(user.save()).to.be.rejectedWith(Error, /shorter than the minimum allowed length/i);
    });
    it('should properly encode a valid password.', async function() {
      user.set('password', '123456');
      await expect(user.save()).to.be.fulfilled;
      await expect(User.findOne({ _id: user.id })).to.eventually.have.property('password').that.matches(bcryptRegex);
    });
    it('should properly update a valid password.', async function() {
      user.set('password', '123456');
      await expect(user.save()).to.be.fulfilled;
      const old = user.get('password');
      expect(old).to.match(bcryptRegex);
      user.set('password', '654321');
      await expect(user.save()).to.be.fulfilled;
      await expect(User.findOne({ _id: user.id })).to.eventually.have.property('password').that.matches(bcryptRegex);
    });
    it('should not update the password if not modified.', async function() {
      await user.save();
      const password = user.get('password');
      await expect(user.save()).to.be.fulfilled.and.eventually.have.property('password', password);
    });
  });

  describe('.photoURL', function() {
    it('should be trimmed.', function() {
      return testTrimmedField(user, 'photoURL', { value: ' http://somedomain.com  ', expected: 'http://somedomain.com' });
    });
    ['ftp://somedomain.com', 'some value', 'http://', 'http://foo', 'www.somedomain.com'].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, async function() {
        user.set('photoURL', value);
        await expect(user.save()).to.be.rejectedWith(Error, /Invalid photo URL/);
      });
    });
    it('should set a default gravatar URL when empty.', async function() {
      user.set('photoURL', '');
      await expect(user.save()).to.be.fulfilled.and.eventually.have.property('photoURL').that.matches(/gravatar/i);
    });
  });

  describe('.toAddress', function() {
    it('should return the proper address.', function(done) {
      user.set({
        givenName: 'John',
        familyName: 'Doe',
        email: 'jdoe@gmail.com',
      });
      expect(user.toAddress).to.equal('John Doe <jdoe@gmail.com>');
      done();
    });
  });

  describe('.api', function() {
    it('should generate a key and secret when set to empty object.', function(done) {
      user.api = {};
      expect(user.api.key).to.have.length.gt(0);
      expect(user.api.secret).to.have.length.gt(0);
      done();
    });

    it('clear the key/secret when set to undefined.', function(done) {
      user.api = {
        key: 'foo',
        secret: 'bar',
      };
      user.api = undefined;
      expect(user.get('api.key')).to.be.undefined;
      expect(user.get('api.secret')).to.be.undefined;
      done();
    });
  });

});
