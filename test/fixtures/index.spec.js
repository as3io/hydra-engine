const fixture = require('../../src/fixtures');
const User = require('../../src/models/user');
const { testObjType } = require('./result.spec');

describe('fixtures', function() {
  it('should return a function.', function(done) {
    expect(fixture).to.be.a('function');
    done();
  });
  describe('#()', function() {
    it('should return a Result object when no generator is found.', function(done) {
      expect(() => {
        fixture({ modelName: 'some-thing-that-does-not-exist' })
      }).to.throw(Error, `No generator found for model named 'some-thing-that-does-not-exist'.`);
      done();
    });
    it('should return a Result object with generated rows.', function(done) {
      const result = fixture(User, 5);
      testObjType(result);
      expect(result.length).to.equal(5);
      done();
    });
  });
});
