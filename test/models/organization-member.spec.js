require('../connections');
const bcrypt = require('bcrypt');
const OrganizationMember = require('../../src/models/organization-member');
const Organization = require('../../src/models/organization');
const Project = require('../../src/models/project');
const User = require('../../src/models/user');
const Seed = require('../../src/fixtures/seed');
const {  testRequiredField, testRefOne } = require('./utils');

const sandbox = sinon.createSandbox();

describe('models/organization-member', function() {
  before(async function() {
    sandbox.stub(bcrypt, 'hash').resolves('$2a$04$jdkrJXkU92FIF4NcprNKWOcMKoOG28ELDrW2HBpDZFSmY/vxOj4VW');
    await Promise.all([
      Organization.remove(),
      Project.remove(),
      User.remove(),
    ]);
  });

  after(async function() {
    sandbox.restore();
    await Promise.all([
      Organization.remove(),
      Project.remove(),
      User.remove(),
    ]);
  });

  let member;
  beforeEach(async function() {
    member = await Seed.organizationMembers(1);
  });
  afterEach(async function() {
    await OrganizationMember.remove();
  });

  describe('.userId', async () => {
    [null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'.`, function() {
        return testRequiredField(member, 'userId', value);
      });
    });
    it('should reject when the organization ID cannot be found.', function() {
      const id = '5b1050d68dd51b05976c9dbf';
      return testRefOne(member, 'userId', id, `No user found for ID ${id}`);
    });
  });

  describe('.organizationId', async () => {
    [null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'.`, function() {
        return testRequiredField(member, 'organizationId', value);
      });
    });
    it('should reject when the organization ID cannot be found.', function() {
      const id = '5b1050d68dd51b05976c9dbf';
      return testRefOne(member, 'organizationId', id, `No organization found for ID ${id}`);
    });
  });

});
