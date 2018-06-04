const Generate = require('../../../src/fixtures/generators/organization-member');

describe('fixtures/generators/organization-member', function() {
  it('should return a factory function', function(done) {
    expect(Generate).to.be.a('function');
    done();
  });
  const fields = [
    { key: 'userId', cb: v => expect(v).to.be.a('string') },
    { key: 'organizationId', cb: v => expect(v).to.be.a('string') },
    { key: 'role', cb: v => expect(v).to.be.a('string') },
    { key: 'projectRoles', cb: (v) => {
      expect(v).to.be.an('array');
      expect(v[0]).to.be.an('object').with.have.keys(['projectId', 'role']);
    } },
    { key: 'acceptedAt', cb: v => expect(v).to.be.an.instanceOf(Date) },
    { key: 'invitedAt', cb: v => expect(v).to.be.an.instanceOf(Date) },
  ];
  const obj = Generate({
    userId: () => '5678',
    organizationId: () => '1234',
    projectId: () => '9876',
  });

  it('should be an object', function(done) {
    expect(obj).to.be.an('object');
    done();
  });
  it('should only contain valid field keys.', function(done) {
    const keys = fields.map(field => field.key);
    expect(obj).to.have.keys(keys);
    done();
  });
  fields.forEach((field) => {
    it(`should only have the ${field.key} property of the appropriate type.`, function(done) {
      expect(obj).to.have.property(field.key);
      field.cb(obj[field.key]);
      done();
    });
  });
});
