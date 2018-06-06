require('../connections');
const Seed = require('../../src/fixtures/seed');
const OrganizationMember = require('../../src/models/organization-member');
const Organization = require('../../src/models/organization');
const User = require('../../src/models/user');
const Project = require('../../src/models/project');
const OrgMemberService = require('../../src/factories/organization-member');

const memberService = OrgMemberService();
const sandbox = sinon.createSandbox();

const testUserIdError = async (methodName) => {
  await expect(memberService[methodName]('', '1234')).to.be.rejectedWith(Error, 'Unable to retrieve organization membership: No user ID was provided')
};

const testOrgIdError = async (methodName) => {
  await expect(memberService[methodName]('1234')).to.be.rejectedWith(Error, 'Unable to retrieve organization membership: No organization ID was provided');
};

describe('factories/organization-member', function() {
  after(async function() {
    await OrganizationMember.remove();
    await Organization.remove();
    await User.remove();
    await Project.remove();
  });

  describe('#getMembership', function() {
    beforeEach(async function() {
      sandbox.spy(OrganizationMember, 'findOne');
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should reject when no user id is provided.', async function() {
      await testUserIdError('getMembership');
      sandbox.assert.notCalled(OrganizationMember.findOne);
    });
    it('should reject when no org id is provided.', async function() {
      await testOrgIdError('getMembership');
      sandbox.assert.notCalled(OrganizationMember.findOne);
    });
    it('should resolve to null when the membership cannot be found.', async function() {
      const userId = '5b1050d68dd51b05976c9dbf';
      const organizationId = '5b15368aa5ac4f0047dabd15';
      await expect(memberService.getMembership(userId, organizationId)).to.eventually.be.null;
      sandbox.assert.calledOnce(OrganizationMember.findOne);
      sandbox.assert.calledWith(OrganizationMember.findOne, { organizationId, userId });
    });
    it('should resolve with the org member document.', async function() {
      const member = await Seed.organizationMembers(1);
      const { userId, organizationId } = member;
      await expect(memberService.getMembership(userId, organizationId)).to.eventually.be.an('object');
      sandbox.assert.calledOnce(OrganizationMember.findOne);
      sandbox.assert.calledWith(OrganizationMember.findOne, { organizationId, userId });
    });
  });

  describe('#getOrgAdminRoles', function() {
    it('should return an array of roles.', async function() {
      expect(memberService.getOrgAdminRoles()).to.deep.equal(['Owner', 'Administrator']);
    });
  });

  describe('#getProjectAdminRoles', function() {
    it('should return an array of roles.', async function() {
      expect(memberService.getProjectAdminRoles()).to.deep.equal(['Owner', 'Administrator']);
    });
  });

  describe('#isOrgAdmin', function() {
    ['Owner', 'Administrator'].forEach((role) => {
      it(`should return true when a role value of ${role}.`, async function() {
        expect(memberService.isOrgAdmin(role)).to.be.true;
      });
    })
    it('should return false when not an admin.', async function() {
      expect(memberService.isOrgAdmin()).to.be.false;
      expect(memberService.isOrgAdmin('Foo')).to.be.false;
    });
  });

  describe('#isProjectAdmin', function() {
    ['Owner', 'Administrator'].forEach((role) => {
      it(`should return true when a role value of ${role}.`, async function() {
        expect(memberService.isProjectAdmin(role)).to.be.true;
      });
    })
    it('should return false when not an admin.', async function() {
      expect(memberService.isProjectAdmin()).to.be.false;
      expect(memberService.isProjectAdmin('Foo')).to.be.false;
    });
  });

  describe('#getOrgRole', function() {
    it('should reject when no user id is provided.', async function() {
      await testUserIdError('getOrgRole');
    });
    it('should reject when no org id is provided.', async function() {
      await testOrgIdError('getOrgRole');
    });
    it('should resolve to null when no membership is found.');
    it('should resolve to the role when set on the member.');
    it('should resolve to null when the membership is found but no role was assigned.');
  });

  describe('#isOrgMember', function() {
    it('should reject when no user id is provided.', async function() {
      await testUserIdError('isOrgMember');
    });
    it('should reject when no org id is provided.', async function() {
      await testOrgIdError('isOrgMember');
    });
    it('should resolve to true when an org role is found');
    it('should resolve to false when an org role is not found');
  });

  describe('#canWriteToOrg', function() {
    it('should reject when no user id is provided.', async function() {
      await testUserIdError('canWriteToOrg');
    });
    it('should reject when no org id is provided.', async function() {
      await testOrgIdError('canWriteToOrg');
    });
    it('should resolve to true when the org role is an admin.');
    it('should resolve to false when the org role is not an admin.');
  });

  describe('#getProjectRole', function() {
    it('should reject when no project id is provided.');
    it('should reject when no user id is provided.');
    it('should reject when no org id is provided.');
    it('should resolve with null when not a project member.');
    it('should resolve with the org admin role if org admin.');
    it('should resolve with null when no project role could be found.');
    it('should resolve with null when a project is found but is not set.');
    it('should resolve with the project role.');
  });

  describe('#isProjectMember', function() {
    it('should reject when no project id is provided.');
    it('should reject when no user id is provided.');
    it('should reject when no org id is provided.');
    it('should resolve to true when a project role is found');
    it('should resolve to false when a a project role is not found');
  });

  describe('#canWriteToProject', function() {
    it('should reject when no project id is provided.');
    it('should reject when no user id is provided.');
    it('should reject when no org id is provided.');
    it('should resolve to true when the org role is an admin.');
    it('should resolve to true when the project role is an admin.');
    it('should resolve to false when the role is not an admin.');
  });

  describe('#getUserOrgIds', function() {
    it('should reject when no user id is provided.');
    it('should resolve with an empty array when not found.');
    it('should resolve with an array of stringified org ids when found.');
  });

  describe('#getUserProjectIds', function() {
    it('should reject when no user id is provided.', async function() {
      await testUserIdError('getUserProjectIds');
    });
    it('should reject when no org id is provided.', async function() {
      await testOrgIdError('getUserProjectIds');
    });
    it('should resolve with an empty array when no org role can be found.');
    it('should resolve with the org project ids directly when user is an org admin');
    it('should resolve with the project roles');
  });

  describe('#createOrgOwner', function() {
    it('should reject when no user id is provided.', async function() {
      await testUserIdError('createOrgOwner');
    });
    it('should reject when no org id is provided.', async function() {
      await testOrgIdError('createOrgOwner');
    });
    it('should reject when the user is already a member of the org.');
    it('should create the org member as an owner.');
  });

});
