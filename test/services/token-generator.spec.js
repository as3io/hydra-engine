require('../connections');
const generator = require('../../src/services/token-generator');
const env = require('../../src/env');

describe('services/token-generator', function() {
  it('should return the generator object.', async function() {
    expect(generator).to.respondTo('create');
    expect(generator).to.respondTo('verify');
    expect(generator).to.respondTo('invalidate');
  });

  it('should set the secret from the environment.', async function() {
    expect (generator.secret).to.equal(env.JWT_SECRET);
  });

});
