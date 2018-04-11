require('../connections');
const Organization = require('../../src/models/organization');
const User = require('../../src/models/user');
const Project = require('../../src/models/user');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField, stubHash } = require('../utils');

const bcryptRegex = /^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9\.\/]{53}$/;
const generateOrganization = () => fixtures(Organization, 1).one();

describe('schema/organization', function() {
  let stub;
  before(function() {
    stub = stubHash();
    return Organization.remove();
  });
  after(function() {
    stub.restore();
    return Organization.remove();
  });
  it('should successfully save.', async function() {
    const organization = generateOrganization();
    await expect(organization.save()).to.be.fulfilled;
  });

  describe('#name', function() {
    let organization;
    beforeEach(function() {
      organization = generateOrganization();
    });
    it('should not be trimmed.', function() {
      return testTrimmedField(Organization, organization, 'name', { value: ' foo@bar.com  ', expected: ' foo@bar.com  ' });
    });
    const values = ['', null, undefined];
    values.forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Organization, organization, 'name', value);
      });
    });
  });

  describe('#members', function() {
    let organization;
    beforeEach(function() {
      organization = generateOrganization();
    });

    it('should allow an empty value', async function() {
      organization.members = [];
      await expect(organization.save()).to.be.fulfilled;
    });

    it('should fail when an invalid user is specified', async function() {
      const member = {
        user: 1234,
      };
      organization.members = [member];
      await expect(organization.save()).to.not.be.fulfilled;
    });

    it('should pass when a valid user is specified', async function() {
      const user = fixtures(User, 1).one().save();
      const member = {
        user: user.id
      };
      organization.members = [member];
      await expect(organization.save()).to.be.fulfilled;
    });

  });

  describe('#members.invited', function() {
    let organization;
    let user;
    beforeEach(function() {
      organization = generateOrganization();
      user = fixtures(User, 1).one().save();
    });

    it('should have a default value', async function() {
      organization.set('members', [{
        user: user.id,
        role: 'Member',
      }]);
      const saved = await organization.save();
      expect(saved.members[0]).to.have.property('invited');
    });
  })

  describe('#members.role', function() {
    let organization;
    let user;
    beforeEach(function() {
      organization = generateOrganization();
      user = fixtures(User, 1).one().save();
    });

    it('Should add the default role when not specified', async function() {
      organization.set('members', [{ user: user.id }]);
      const saved = await organization.save();
      expect(saved.members[0]).to.have.property('role', 'Member');
    });

    [null].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        const members = [{
          user: user.id,
          role: value,
        }];
        return testRequiredField(Organization, organization, 'members', members);
      });
    });
    const allowed = ['Owner', 'Member', 'Administrator'];
    allowed.forEach((value) => {
      it(`should be fulfilled when the enum value is '${value}'`, async function() {
        const members = [{
          user: user.id,
          role: value,
        }];
        organization.set('members', members);
        await expect(organization.save()).to.be.fulfilled;
      });
    });
    it('should reject when the value is not in the enum list.', async function() {
      const members = [{
        user: user.id,
        role: 'whatever',
      }];
      organization.set('members', members);
      await expect(organization.save()).to.be.rejectedWith(Error, /is not a valid enum value/);
    });
  });


  describe('#members.project', function() {
    let organization;
    let user;
    let project;
    beforeEach(async function() {
      organization = generateOrganization();
      user = await fixtures(User, 1).one().save();
      project = await fixtures(Project, 1, { organizationId: () => organization.id }).one().save();
    });

    it('should save when a valid project is specified', async function() {
      const members = [{
        user: user.id,
        projects: [{ project: project.id }],
      }];
      organization.set('members', members);
      await expect(organization.save()).to.be.fulfilled;
    });

    it('should not save when an invalid project is specified', async function() {
      const members = [{
        user: user.id,
        projects: [{ project: 1234 }],
      }];
      organization.set('members', members);
      await expect(organization.save()).to.not.be.fulfilled;
    });
  })

});
