require('../connections');
const bcrypt = require('bcrypt');
const Repo = require('../../src/repositories/user');
const Organization = require('../../src/repositories/organization');
const Project = require('../../src/repositories/project');
const Model = require('../../src/models/user');
const { stubHash } = require('../utils');
const Utils = require('../utils');

const createUser = () => Repo.generate().one().save();

describe('repositories/user', function() {
  let stub;
  before(function() {
    stub = stubHash();
    return Repo.remove();
  });
  after(function() {
    stub.restore();
    return Repo.remove();
  });
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });

  describe('#paginate', function() {
    it('should return a Pagination instance.', function(done) {
      Utils.testPaginate(Repo);
      done();
    })
  });

  describe('#create', function() {
    it('should return a rejected promise when valiation fails.', async function() {
      await expect(Repo.create({})).to.be.rejectedWith(Error, /validation/i);
      await expect(Repo.create()).to.be.rejectedWith(Error, /validation/i);
    });
    it('should return a fulfilled promise with the model.', async function() {
      const payload = Repo.generate().one();
      const user = await Repo.create(payload);
      const found = await Repo.findById(user.get('id'));

      expect(found).to.be.an.instanceof(Model);
      expect(found).to.have.property('id').equal(user.get('id'));
    });
  });

  describe('#organizationInvite', function() {
    let user;
    let organization;
    let role = 'Administrator';
    let projectRoles = [];

    beforeEach(async function() {
      const payload = Repo.generate().one();
      user = await Repo.create(payload);
      const seed = await Organization.seed();
      organization = seed.one();
    });

    afterEach(async function() {
      await Organization.remove();
    })

    it('should reject when the org does not exist', async function() {
      const { email, givenName, familyName } = await user;
      const payload = {
        email,
        givenName,
        familyName,
        role,
        projectRoles,
      };
      const promise = Repo.organizationInvite('5af0b41d11b3e6002183c51b', payload);
      await expect(promise).to.eventually.be.rejectedWith(Error, 'Organization with id "5af0b41d11b3e6002183c51b" was not found');
    });

    it('should create a user if one does not exist', async function() {
      const payload = {
        email: 'foo@bar.baz.dill',
        givenName: 'Joe',
        familyName: 'Blow',
        role,
        projectRoles,
      };
      const promise = Repo.organizationInvite(organization.id, payload);
      await expect(promise).to.eventually.be.fulfilled;

      const created = Repo.findByEmail(payload.email);
      await expect(created).to.eventually.be.fulfilled;
      const data = await created;
      expect(data).to.have.property('email', payload.email);
      expect(data).to.have.property('givenName', payload.givenName);
      expect(data).to.have.property('familyName', payload.familyName);
    })

    it('should set a new token for the user to accept the invitation', async function() {
      const { email, givenName, familyName, token } = await user;
      const payload = {
        email,
        givenName,
        familyName,
        role,
        projectRoles,
      };
      const promise = Repo.organizationInvite(organization.id, payload);
      await expect(promise).to.eventually.be.fulfilled;
      const newPromise = Repo.findById(user.id);
      await expect(newPromise).to.eventually.be.fulfilled;
      const newUser = await newPromise;
      expect(newUser.token).to.not.equal(user.token);
    });

    it('should store the requested project roles', async function() {
      const { email, givenName, familyName } = await user;
      const project = await Project.create({
        name: 'Test',
        organization: organization.id,
      });
      const payload = {
        email,
        givenName,
        familyName,
        role,
        projectRoles: [
          {
            id: project.id,
            role: 'Administrator'
          }
        ],
      };
      const promise = Repo.organizationInvite(organization.id, payload);
      await expect(promise).to.eventually.be.fulfilled;

      const response = await Organization.findById(organization.id);
      expect(response.get('members.0.projects.0.role')).to.equal('Administrator');
      expect(response.get('members.0.projects.0.project') + '').to.equal(project.id);
    });

    it('should not add duplicate invitations/memberships', async function() {
      const { email, givenName, familyName, token } = await user;
      const payload = {
        email,
        givenName,
        familyName,
        role,
        projectRoles,
      };
      const promise = Repo.organizationInvite(organization.id, payload);
      await expect(promise).to.eventually.be.fulfilled;
      const promise2 = Repo.organizationInvite(organization.id, payload);
      await expect(promise2).to.eventually.be.fulfilled;
      const newPromise = Repo.findById(user.id);
      await expect(newPromise).to.eventually.be.fulfilled;
      const org = await Organization.findById(organization.id);
      expect(org.get('members.length')).to.equal(1);
    });

    it('should return a fulfilled promise with the model', async function() {
      const { email, givenName, familyName } = await user;
      const payload = {
        email,
        givenName,
        familyName,
        role,
        projectRoles,
      };
      const promise = Repo.organizationInvite(organization.id, payload, false);
      await expect(promise).to.eventually.be.fulfilled;
    });
  });

  describe('#sendPasswordReset', function() {
    let user;
    beforeEach(async function() {
      const payload = Repo.generate().one();
      user = await Repo.create(payload);
    });
    afterEach(async function() {
      await user.remove();
    })

    it('should error when given no arguments', () => {
      return expect(Repo.sendPasswordReset())
        .to.eventually.be
        .rejectedWith(Error, 'no email address was provided')
      ;
    });
    it('should error when given an invalid email', () => {
      return expect(Repo.sendPasswordReset('does@not.exist'))
        .to.eventually.be
        .rejectedWith(Error, 'No user was found')
      ;
    });
    it('should set a new token for the user', async () => {
      await expect(Repo.sendPasswordReset(user.email)).to.eventually.be.fulfilled;
      const updated = await expect(Repo.findByEmail(user.email)).to.eventually.be.fulfilled;
      expect(updated.token).to.not.equal(user.token);
    });
  });

  describe('#magicLogin', function() {
    let user;
    beforeEach(async function() {
      const payload = Repo.generate().one();
      user = await Repo.create(payload);
    });
    afterEach(async function() {
      await user.remove();
    })

    it('should error when given no arguments', () => {
      return expect(Repo.magicLogin())
        .to.eventually.be
        .rejectedWith(Error, 'no email address was provided')
      ;
    });
    it('should error when given an invalid email', () => {
      return expect(Repo.magicLogin('does@not.exist'))
        .to.eventually.be
        .rejectedWith(Error, 'No user was found')
      ;
    });
    it('should set a new token for the user', async () => {
      await expect(Repo.magicLogin(user.email)).to.eventually.be.fulfilled;
      const updated = await expect(Repo.findByEmail(user.email)).to.eventually.be.fulfilled;
      expect(updated.token).to.not.equal(user.token);
    });
  });

  describe('#findById', function() {
    let user;
    before(async function() {
      user = await createUser();
    });
    after(async function() {
      await Repo.remove();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.findById()).to.be.rejectedWith(Error, 'Unable to find user: no ID was provided.');
    });
    it('should return a fulfilled promise with a `null` document when not found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.findById(id)).to.be.fulfilled.and.become(null);
    });
    it('should return a fulfilled promise with a document when found.', async function() {
      await expect(Repo.findById(user.get('id'))).to.be.fulfilled.and.eventually.be.an.instanceof(Model).with.property('id').equal(user.get('id'));
    });
  });

  describe('#normalizeEmail', function() {
    [null, undefined, ''].forEach((value) => {
      it(`should return an empty string when the value is '${value}'`, function(done) {
        expect(Repo.normalizeEmail(value)).to.equal('');
        done();
      });
    });

    it('should return a trimmed, lowercased value.', function(done) {
      expect(Repo.normalizeEmail(' foo@BAr.com ')).to.equal('foo@bar.com');
      done();
    });
  });

  describe('#findByEmail', function() {
    let user;
    before(async function() {
      user = await createUser();
    });
    after(async function() {
      await Repo.remove();
    });
    [null, undefined, '', '   '].forEach((value) => {
      it(`should return a rejected promise when the email is '${value}'.`, async function() {
        await expect(Repo.findByEmail(value)).to.be.rejectedWith(Error, 'Unable to find user: no email address was provided.');
      });
    });
    it('should return a fulfilled promise with a `null` document when not found.', async function() {
      const email = 'some-address@domain.com';
      await expect(Repo.findByEmail(email)).to.be.fulfilled.and.become(null);
    });
    it('should return a fulfilled promise with a document when found.', async function() {
      await expect(Repo.findByEmail(user.get('email'))).to.be.fulfilled.and.eventually.be.an.instanceof(Model).with.property('id').equal(user.get('id'));
    });
  });

  describe('#generate', function() {
    it('should return a fixture result with one record.', function(done) {
      const results = Repo.generate();
      expect(results).to.be.an('object');
      expect(results.length).to.equal(1);
      done();
    });
    it('should return a fixture result with the specified number of records.', function(done) {
      const results = Repo.generate(5);
      expect(results).to.be.an('object');
      expect(results.length).to.equal(5);
      done();
    });
  });

  describe('#removeByEmail', function() {
    let user;
    before(async function() {
      user = await createUser();
    });
    after(async function() {
      await Repo.remove();
    });
    [null, undefined, '', '   '].forEach((value) => {
      it(`should return a rejected promise when the email is '${value}'.`, async function() {
        await expect(Repo.removeByEmail(value)).to.be.rejectedWith(Error, 'Unable to remove user: no email address was provided.');
      });
    });
    it('remove the requested user.', async function() {
      await expect(Repo.removeByEmail(user.email)).to.be.fulfilled;
      await expect(Repo.findByEmail(user.email)).to.be.fulfilled.and.eventually.be.null;
    });
  });

  describe('#login', function() {
    let user;
    const cleartext = 'test password';
    before(async function() {
      // Unstub to simulate true behavior.
      stub.restore();
      user = Repo.generate().one();
      user.set('password', cleartext);
      await user.save();
    });
    after(async function() {
      // restub hashing
      stub = stubHash();
      await Repo.remove();
    });
    [null, undefined, '', false, 0].forEach((value) => {
      it(`should reject when the password is '${value}'.`, async function() {
        await expect(Repo.login('foo@bar.com', value)).to.be.rejectedWith(Error, 'Unable to login user. No password was provided.');
      });
    });

    it('should reject when no user was found for the provided email address.', async function() {
      await expect(Repo.login('foo@bar.com.tw', 'password')).to.be.rejectedWith(Error, 'No user was found for the provided email address.');
    });
    it('should reject when the provided email address is empty.', async function() {
      await expect(Repo.login('', 'password')).to.be.rejectedWith(Error, 'Unable to find user: no email address was provided.');
    });
    it('should reject when the cleartext password is wrong.', async function() {
      await expect(Repo.login(user.email, 'some other password')).to.be.rejectedWith(Error, 'The provided password was incorrect.');
    });
    it('should fulfill with a the user and session objects when the cleartext password is correct.', async function() {
      await expect(Repo.login(user.email, cleartext)).to.be.fulfilled.and.eventually.be.an('object').with.all.keys('user', 'session');
    });
  });

  describe('#retrieveSession', function() {
    let user;
    let token;
    before(async function() {
      // Unstub to simulate true behavior.
      stub.restore();
      const cleartext = 'test password';
      user = Repo.generate().one();
      user.set('password', cleartext);
      await user.save();
      const { session } = await Repo.login(user.email, cleartext);
      token = session.token;
    });
    after(async function() {
      stub = stubHash();
      await Repo.remove();
    });
    it('should fulfill with a valid user token.', async function() {
      await expect(Repo.retrieveSession(token)).to.be.fulfilled.and.eventually.be.an('object').with.all.keys('user', 'session');
    });
    it('should reject if a valid session was found, but the user no longer exists.', async function() {
      await Repo.removeByEmail(user.email);
      await expect(Repo.retrieveSession(token)).to.be.rejectedWith(Error, 'Unable to retrieve session: the provided user could not be found.');
    });
  });

  describe('#seed', function() {
    it('should generate and save the fixture data.', async function() {
      await expect(Repo.seed()).to.be.fulfilled.and.eventually.be.an('object');
      await expect(Repo.seed({ count: 2 })).to.be.fulfilled.and.eventually.be.an('object');
    });
  });

});
