const Generate = require('../../../src/fixtures/generators/content');

describe('fixtures/generators/content', function() {
  it('should return a factory function', function(done) {
    expect(Generate).to.be.a('function');
    done();
  });
  const fields = [
    { key: 'title', cb: v => expect(v).to.be.a('string') },
    { key: 'teaser', cb: v => expect(v).to.be.a('string') },
    { key: 'slug', cb: v => expect(v).to.be.a('string') },
    { key: 'text', cb: v => expect(v).to.be.a('string') },
    { key: 'project', cb: v => expect(v).to.be.a('string') },
  ];
  const obj = Generate({
    projectId: () => '1234',
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
