require('../connections');
const Seed = require('../../src/fixtures/seed');
const Organization = require('../../src/models/organization');
const OrganizationMember = require('../../src/models/organization-member');
const User = require('../../src/models/user');
const Project = require('../../src/models/project');
const Token = require('../../src/models/token');
const mailer = require('../../src/services/mailer');
const OrgService = require('../../src/factories/organization');
const tokenGenerator = require('../../src/services/token-generator');

const orgService = OrgService();

const sandbox = sinon.createSandbox();

describe('factories/organization', function() {
  before(async function() {
    await Token.remove();
    await Organization.remove();
    await OrganizationMember.remove();
    await User.remove();
  });
  after(async function() {
    await Organization.remove();
    await Token.remove();
    await User.remove();
    await OrganizationMember.remove();
  });

  describe('#inviteUserToOrg', function() {
    let payload;
    let organization;
    beforeEach(async function() {
      payload = { email: 'foo@bar.com', givenName: 'John', familyName: 'Doe' };
      organization = await Seed.organizations(1);
      sandbox.stub(mailer, 'sendOrganizationInvitation').resolves();
    });

    afterEach(async function() {
      await User.remove();
      await OrganizationMember.remove();
      sandbox.restore();
    });

    it('should reject when no organization was provided.', async function() {
      await expect(orgService.inviteUserToOrg('', payload)).to.be.rejectedWith(Error, 'Unable to invite user to org: No organization was provided.');
    });
    it('should reject when no email address was provided.', async function() {
      delete payload.email;
      await expect(orgService.inviteUserToOrg(organization, payload)).to.be.rejectedWith(Error, 'Unable to invite user to org: No email address was provided.');
      await expect(orgService.inviteUserToOrg(organization)).to.be.rejectedWith(Error, 'Unable to invite user to org: No email address was provided.');
    });
    it('should create a new user when not found.', async function() {
      const promise = orgService.inviteUserToOrg(organization, payload);
      await expect(promise).to.eventually.be.an('object');
      const orgMember = await promise;
      await expect(User.findById(orgMember.userId)).to.eventually.be.an('object');
    });
    it('should use an existng user when found.', async function() {
      const doc = await User.create(payload);
      const promise = orgService.inviteUserToOrg(organization, payload);
      await expect(promise).to.eventually.be.an('object');
      const orgMember = await promise;
      expect(`${orgMember.userId}`).to.equal(`${doc.id}`);
    });
    it('should remove any previous membership for the user and org.', async function() {
      const user = await User.create(payload);
      const member = await OrganizationMember.create({
        userId: user.id,
        organizationId: organization.id,
      });
      const promise = orgService.inviteUserToOrg(organization, payload);
      await expect(promise).to.eventually.be.an('object');
      await expect(OrganizationMember.findById(member.id)).to.eventually.be.null;
    });
    it('should create new organization membership without project roles.', async function() {
      const promise = orgService.inviteUserToOrg(organization, payload);
      await expect(promise).to.eventually.be.an('object');
      const orgMember = await promise;
      expect(orgMember.projectRoles).to.be.an('array');
      expect(orgMember.projectRoles.length).to.equal(0);
    });
    it('should create new organization membership with project roles.', async function() {

      const project = await Seed.projects(1);

      payload.projectRoles = [
        { projectId: project.id, role: 'Owner' },
      ];

      const promise = orgService.inviteUserToOrg(organization, payload);
      await expect(promise).to.eventually.be.an('object');
      const orgMember = await promise;
      expect(orgMember.projectRoles).to.be.an('array');
      expect(orgMember.projectRoles.length).to.equal(1);
      expect(orgMember.projectRoles[0].role).to.equal('Owner');
      expect(orgMember.projectRoles[0].projectId.toString()).to.equal(project.id.toString());

      await Project.remove();
    });
    it('should create the user org invitation token.', async function() {
      const user = await User.create(payload);
      const promise = orgService.inviteUserToOrg(organization, payload);
      await expect(promise).to.eventually.be.an('object');
      await expect(Token.findOne({
        action: 'user-org-invitation',
        'payload.uid': user.id.toString(),
        'payload.oid': organization.id.toString(),
      })).to.eventually.be.an('object');
    });
    it('should send the organization invite email.', async function() {
      const user = await User.create(payload);
      const promise = orgService.inviteUserToOrg(organization, payload);
      await expect(promise).to.eventually.be.an('object');

      sinon.assert.calledOnce(mailer.sendOrganizationInvitation);
    });
  });

  describe('#acknowledgeUserInvite', function() {
    let organization;
    let user;
    beforeEach(async function() {
      organization = await Seed.organizations(1);
      user = await Seed.users(1);
      sandbox.stub(tokenGenerator, 'verify').resolves({
        id: '1234',
        payload: {
          uid: user.id.toString(),
          oid: organization.id.toString(),
        }
      });
      sandbox.stub(tokenGenerator, 'invalidate').resolves();
    });
    afterEach(async function() {
      sandbox.restore();
    });
    after(async function() {
      await Organization.remove();
      await OrganizationMember.remove();
      await User.remove();
    });

    it('should reject when no org membership was found for the token.', async function() {
      await expect(orgService.acknowledgeUserInvite('some-token')).to.be.rejectedWith(Error, 'No organization membership was found for the provided token.');
      sinon.assert.calledOnce(tokenGenerator.verify);
      sinon.assert.calledWith(tokenGenerator.verify, 'user-org-invitation', 'some-token');
      sinon.assert.notCalled(tokenGenerator.invalidate);
    });
    it('should update the org member accepted date and invalidate the token.', async function() {
      const member = await OrganizationMember.create({ userId: user.id, organizationId: organization.id, acceptedAt: null });
      expect(member.acceptedAt).to.be.null;
      const promise = orgService.acknowledgeUserInvite('some-token');
      await expect(promise).to.eventually.be.an('object');
      const result = await promise;
      expect(result.id.toString()).to.equal(member.id.toString());
      expect(result.acceptedAt).to.be.an.instanceOf(Date);
      sinon.assert.calledOnce(tokenGenerator.invalidate);
      sinon.assert.calledWith(tokenGenerator.invalidate, '1234');
    });
  });
});
