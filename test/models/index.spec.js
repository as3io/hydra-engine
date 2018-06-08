const models = require('../../src/models');

describe('models/index', function() {
  it('should be an object with the models.', function(done) {
    expect(models).to.be.an('object').with.all.keys(
      'User',
      'Organization',
      'OrganizationMember',
      'Project',
      'Story',
      'Token',
    );
    done();
  });
});
