const sut = require('../../src/auth-strategies/basic');
const { BasicStrategy } = require('passport-http');
const Project = require('../../src/repositories/project');
const Key = require('../../src/models/key');

describe('auth-strategies/basic', function() {
  let key;
  before(async function() {
    const seed = await Project.seed();
    const project = seed.one();
    key = await Key.create({
      project: project.id,
      scope: 'Project',
      purpose: 'Public',
    });
  })
  after(async function() {
    await Project.remove();
    await Key.remove();
  })

  it('should export an instance of a passport-http/strategy', () => {
    expect(sut).to.be.an.instanceof(BasicStrategy);
  });
  it('should error when given an invalid key', (done) => {
    sut._verify('asdf-asdf-asdf-asdf', 'does not matter', (err, data) => {
      expect(err).to.be.an.instanceOf(Error).and.have.property('message', 'Invalid API Key');
      done();
    });
  });
  it('should not error when given a valid key', (done) => {
    sut._verify(key.value, 'does not matter', (err, data) => {
      expect(data).to.be.an('object').with.property('key');
      expect(key.id).to.equal(data.key.id);
      done();
    });
  });

});
