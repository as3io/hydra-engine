require('../connections');
const Seed = require('../../src/fixtures/seed');

describe('fixtures/seed', function() {
  it('should generate one document.', async function() {
    await expect(Seed.users(1)).to.eventually.be.an('object');
  });
  it('should generate mutliple documents.', async function() {
    await expect(Seed.users(3)).to.eventually.be.an('array').with.property('length', 3);
  });
});
