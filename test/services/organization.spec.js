require('../connections');
const orgService = require('../../src/services/organization');

describe('services/organization', function() {
  it('should return the org service object.', async function() {
    expect(orgService).to.respondTo('inviteUserToOrg');
    expect(orgService).to.respondTo('acknowledgeUserInvite');
  });
});
