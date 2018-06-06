require('../connections');
const Seed = require('../../src/fixtures/seed');
const OrganizationMember = require('../../src/models/organization-member');
const Organization = require('../../src/models/organization');
const User = require('../../src/models/user');
const Project = require('../../src/models/project');
const OrgMemberService = require('../../src/factories/organization-member');

const memberService = OrgMemberService();
const sandbox = sinon.createSandbox();

describe('factories/organization-member', function() {
  describe('#getMembership', function() {
    beforeEach(async function() {
      sandbox.stub(OrganizationMember, 'findOne')
        .withArgs({ userId: '1234', organizationId: '1234' }).resolves({})
        .withArgs({ userId: '5678', organizationId: '5678' }).resolves(null)
      ;
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should reject when no user id is provided.', async function() {
      await expect(memberService.getMembership('', '1234')).to.be.rejectedWith(Error, 'Unable to retrieve organization membership: No user ID was provided');
      sandbox.assert.notCalled(OrganizationMember.findOne);
    });
    it('should reject when no org id is provided.', async function() {
      await expect(memberService.getMembership('1234')).to.be.rejectedWith(Error, 'Unable to retrieve organization membership: No organization ID was provided');
      sandbox.assert.notCalled(OrganizationMember.findOne);
    });
    it('should resolve to null when the membership cannot be found.', async function() {
      await expect(memberService.getMembership('5678', '5678')).to.eventually.be.null;
      sandbox.assert.calledOnce(OrganizationMember.findOne);
      sandbox.assert.calledWith(OrganizationMember.findOne, { organizationId: '5678', userId: '5678' });
    });
    it('should resolve with the org member document.', async function() {
      await expect(memberService.getMembership('1234', '1234')).to.eventually.be.an('object');
      sandbox.assert.calledOnce(OrganizationMember.findOne);
      sandbox.assert.calledWith(OrganizationMember.findOne, { organizationId: '1234', userId: '1234' });
    });
  });

  describe('#getOrgAdminRoles', function() {
    it('should return an array of roles.', async function() {
      expect(memberService.getOrgAdminRoles()).to.deep.equal(['Owner', 'Administrator']);
    });
  });

  describe('#getProjectAdminRoles', function() {
    it('should return an array of roles.', async function() {
      expect(memberService.getProjectAdminRoles()).to.deep.equal(['Owner', 'Administrator', 'Developer']);
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
    beforeEach(async function() {
      sandbox.stub(memberService, 'getMembership')
        .withArgs('1234', '1234').resolves({})
        .withArgs('5678', '5678').resolves(null)
        .withArgs('7890', '7890').resolves({ role: 'User' })
      ;
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should resolve to null when no membership is found.', async function() {
      await expect(memberService.getOrgRole('5678', '5678')).to.eventually.equal(null);
      sandbox.assert.calledOnce(memberService.getMembership);
      sandbox.assert.calledWith(memberService.getMembership, '5678', '5678');
    });
    it('should resolve to the role when set on the member.', async function() {
      await expect(memberService.getOrgRole('7890', '7890')).to.eventually.equal('User');
      sandbox.assert.calledOnce(memberService.getMembership);
      sandbox.assert.calledWith(memberService.getMembership, '7890', '7890');
    });
    it('should resolve to null when member is found by no role is assigned.', async function() {
      await expect(memberService.getOrgRole('1234', '1234')).to.eventually.equal(null);
      sandbox.assert.calledOnce(memberService.getMembership);
      sandbox.assert.calledWith(memberService.getMembership, '1234', '1234');
    });
  });

  describe('#isOrgMember', function() {
    beforeEach(async function() {
      sandbox.stub(memberService, 'getOrgRole')
        .withArgs('1234', '1234').resolves('Member')
        .withArgs('5678', '5678').resolves(null)
      ;
    });
    afterEach(async function() {
      sandbox.restore();
    });
    it('should resolve to true when an org role is found.', async function() {
      await expect(memberService.isOrgMember('1234', '1234')).to.eventually.equal(true);
      sandbox.assert.calledOnce(memberService.getOrgRole);
      sandbox.assert.calledWith(memberService.getOrgRole, '1234', '1234');
    });
    it('should resolve to false when an org role is not found.', async function() {
      await expect(memberService.isOrgMember('5678', '5678')).to.eventually.equal(false);
      sandbox.assert.calledOnce(memberService.getOrgRole);
      sandbox.assert.calledWith(memberService.getOrgRole, '5678', '5678');
    });
  });

  describe('#canWriteToOrg', function() {
    beforeEach(async function() {
      sandbox.stub(memberService, 'getOrgRole')
        .withArgs('1234', '1234').resolves('Member')
        .withArgs('5678', '5678').resolves(null)
        .withArgs('7890', '7890').resolves('Administrator')
      ;
    });
    afterEach(async function() {
      sandbox.restore();
    });
    it('should resolve to false when the org role is not an admin.', async function() {
      await expect(memberService.canWriteToOrg('1234', '1234')).to.eventually.equal(false);
      sandbox.assert.calledOnce(memberService.getOrgRole);
      sandbox.assert.calledWith(memberService.getOrgRole, '1234', '1234');
    });
    it('should resolve to false when the org role is empty.', async function() {
      await expect(memberService.canWriteToOrg('5678', '5678')).to.eventually.equal(false);
      sandbox.assert.calledOnce(memberService.getOrgRole);
      sandbox.assert.calledWith(memberService.getOrgRole, '5678', '5678');
    });
    it('should resolve to true when the org role is an admin.', async function() {
      await expect(memberService.canWriteToOrg('7890', '7890')).to.eventually.equal(true);
      sandbox.assert.calledOnce(memberService.getOrgRole);
      sandbox.assert.calledWith(memberService.getOrgRole, '7890', '7890');
    });
  });

  describe('#getProjectRole', function() {
    const cases = [
      { resolves: null, expected: null },
      { resolves: {}, expected: null },
      { resolves: { role: 'User' }, expected: null },
      { resolves: { projectRoles: [] }, expected: null },
      { resolves: { projectRoles: [ { projectId: 'no-match' } ] }, expected: null },
      { resolves: { projectRoles: [ { projectId: 'pid' } ] }, expected: null },
      { resolves: { role: 'Owner' }, expected: 'Owner' },
      { resolves: { projectRoles: [ { role: 'Member', projectId: 'pid' } ] }, expected: 'Member' },
    ];

    beforeEach(async function() {
      const stub = sandbox.stub(memberService, 'getMembership');
      cases.forEach((obj, index) => {
        stub.withArgs(`uid-${index}`, `oid-${index}`).resolves(obj.resolves);
      });
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should reject when no project id is provided.', async function() {
      await expect(memberService.getProjectRole('1234', '1234')).to.be.rejectedWith(Error, 'Unable to retrieve project role: no project ID was provided.');
      sandbox.assert.notCalled(memberService.getMembership);
    });

    cases.forEach((obj, index) => {
      it(`should return ${obj.expected} when membership is ${JSON.stringify(obj.resolves)}`, async function() {
        await expect(memberService.getProjectRole(`uid-${index}`, `oid-${index}`, 'pid')).to.eventually.equal(obj.expected);
        sandbox.assert.calledOnce(memberService.getMembership);
        sandbox.assert.calledWith(memberService.getMembership, `uid-${index}`, `oid-${index}`);
      });
    });
  });

  describe('#isProjectMember', function() {
    beforeEach(async function() {
      sandbox.stub(memberService, 'getProjectRole')
        .withArgs('1234', '5678', '7890').resolves('Member')
        .withArgs('7890', '1234', '5678').resolves(null)
      ;
    });
    afterEach(async function() {
      sandbox.restore();
    });
    it('should resolve to true when a project role is found', async function() {
      await expect(memberService.isProjectMember('1234', '5678', '7890')).to.eventually.equal(true);
      sandbox.assert.calledOnce(memberService.getProjectRole);
      sandbox.assert.calledWith(memberService.getProjectRole, '1234', '5678', '7890');
    });
    it('should resolve to false when a a project role is not found', async function() {
      await expect(memberService.isProjectMember('7890', '1234', '5678')).to.eventually.equal(false);
      sandbox.assert.calledOnce(memberService.getProjectRole);
      sandbox.assert.calledWith(memberService.getProjectRole, '7890', '1234', '5678');
    });
  });

  describe('#canWriteToProject', function() {
    beforeEach(async function() {
      sandbox.stub(memberService, 'getProjectRole')
        .withArgs('1234', '5678', '7890').resolves('Member')
        .withArgs('7890', '1234', '5678').resolves('Owner')
        .withArgs('5678', '7890', '1234').resolves('Developer')
      ;
    });
    afterEach(async function() {
      sandbox.restore();
    });
    it('should resolve to false when the role is not an admin.', async function() {
      await expect(memberService.canWriteToProject('1234', '5678', '7890')).to.eventually.equal(false);
      sandbox.assert.calledOnce(memberService.getProjectRole);
      sandbox.assert.calledWith(memberService.getProjectRole, '1234', '5678', '7890');
    });
    it('should resolve to true when the org role is an admin.', async function() {
      await expect(memberService.canWriteToProject('7890', '1234', '5678')).to.eventually.equal(true);
      sandbox.assert.calledOnce(memberService.getProjectRole);
      sandbox.assert.calledWith(memberService.getProjectRole, '7890', '1234', '5678');
    });
    it('should resolve to true when the project role is an admin.', async function() {
      await expect(memberService.canWriteToProject('5678', '7890', '1234')).to.eventually.equal(true);
      sandbox.assert.calledOnce(memberService.getProjectRole);
      sandbox.assert.calledWith(memberService.getProjectRole, '5678', '7890', '1234');
    });
  });

  describe('#getUserOrgIds', function() {
    beforeEach(async function() {
      sandbox.stub(OrganizationMember, 'find')
        .withArgs({ userId: '1234' }, { organizationId: 1 }).resolves([])
        .withArgs({ userId: '5678' }, { organizationId: 1 }).resolves([
          { organizationId: '1234' },
          { organizationId: { toString: () => '5678' } },
        ])
      ;
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should reject when no user id is provided.', async function() {
      await expect(memberService.getUserOrgIds()).to.be.rejectedWith(Error, 'Unable to retrieve user organizations. No user ID was provided.');
      sandbox.assert.notCalled(OrganizationMember.find);
    });
    it('should resolve with an empty array when not found.', async function() {
      await expect(memberService.getUserOrgIds('1234')).to.eventually.deep.equal([]);
      sandbox.assert.calledOnce(OrganizationMember.find);
      sandbox.assert.calledWith(OrganizationMember.find, { userId: '1234' }, { organizationId: 1 });
    });
    it('should resolve with an array of stringified org ids when found.', async function() {
      await expect(memberService.getUserOrgIds('5678')).to.eventually.deep.equal(['1234', '5678']);
      sandbox.assert.calledOnce(OrganizationMember.find);
      sandbox.assert.calledWith(OrganizationMember.find, { userId: '5678' }, { organizationId: 1 });
    });
  });

  describe('#getUserProjectIds', function() {
    it('should resolve with an empty array when no org role can be found.');
    it('should resolve with the org project ids directly when user is an org admin');
    it('should resolve with the project roles');
  });

  describe('#createOrgOwner', function() {
    it('should reject when the user is already a member of the org.');
    it('should create the org member as an owner.');
  });

});
