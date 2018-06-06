require('../connections');

describe('factories/organization-member', function() {
  describe('#getMembership', function() {
    it('should reject when no user id is provided.');
    it('should reject when no org id is provided.');
    it('should resolve to null when the membership cannot be found.');
    it('should resolve with the org member document.');
  });

  describe('#getOrgAdminRoles', function() {
    it('should return an array of roles.');
  });

  describe('#getProjectAdminRoles', function() {
    it('should return an array of roles.');
  });

  describe('#isOrgAdmin', function() {
    it('should return false when not an admin.');
    it('should return true when an admin.');
  });

  describe('#isProjectAdmin', function() {
    it('should return false when not an admin.');
    it('should return true when an admin.');
  });

  describe('#getOrgRole', function() {
    it('should reject when no user id is provided.');
    it('should reject when no org id is provided.');
    it('should resolve to null when no membership is found.');
    it('should resolve to the role when set on the member.');
    it('should resolve to null when the membership is found but no role was assigned.');
  });

  describe('#isOrgMember', function() {
    it('should reject when no user id is provided.');
    it('should reject when no org id is provided.');
    it('should resolve to true when an org role is found');
    it('should resolve to false when an org role is not found');
  });

  describe('#canWriteToOrg', function() {
    it('should reject when no user id is provided.');
    it('should reject when no org id is provided.');
    it('should resolve to true when the org role is an admin.');
    it('should resolve to false when the org role is not an admin.');
  });

  describe('#getProjectRole', function() {
    it('should reject when no project id is provided.');
    it('should reject when no user id is provided.');
    it('should reject when no org id is provided.');
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
    it('should reject when no user id is provided.');
    it('should reject when no org id is provided.');
  });

  describe('#createOrgOwner', function() {
    it('should reject when no user id is provided.');
    it('should reject when no org id is provided.');
    it('should reject when the user is already a member of the org.');
    it('should create the org member as an owner.');
  });

});
