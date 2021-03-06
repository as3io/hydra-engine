require('../connections');
const Organization = require('../../src/models/organization');
const Seed = require('../../src/fixtures/seed');
const { testTrimmedField, testUniqueField, testRequiredField } = require('./utils');

describe('models/organization', function() {
  before(async function() {
    await Organization.remove();
  });

  let organization;
  beforeEach(async function() {
    organization = await Seed.organizations(1);
  });
  afterEach(async function() {
    await Organization.remove();
  });

  describe('.name', async () => {
    ['', ' ', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'.`, function() {
        return testRequiredField(organization, 'name', value);
      });
    });
    it('should be trimmed.', function() {
      return testTrimmedField(organization, 'name');
    });
  });

  describe('.description', async () => {
    it('should be trimmed.', function() {
      return testTrimmedField(organization, 'description');
    });
  });

  describe('.photoURL', async () => {
    ['', ' ', null, undefined].forEach((value) => {
      it(`should set a default robo hash when the value is '${value}'.`, async function() {
        organization.photoURL = value;
        const promise = organization.save();
        await expect(promise).to.be.fulfilled;
        const result = await promise;
        expect(result.photoURL).to.equal(`https://robohash.org/${result.id}?set=set3&bgset=bg2`);
      });
    });
    ['foo', 'http', 'http://www.google.com', 'https://'].forEach((value) => {
      it(`should reject when the value is a non-URL: '${value}'.`, async function() {
        organization.photoURL = value;
        await expect(organization.save()).to.be.rejectedWith(Error, /Invalid photo URL/i);
      });
    });
  });

});
