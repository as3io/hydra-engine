const fixture = require('../../src/fixtures');
const User = require('../../src/models/user');
const { testObjType } = require('./result.spec');

describe('fixtures', function() {
  it('should return a function.', function(done) {
    expect(fixture).to.be.a('function');
    done();
  });
  describe('#()', function() {
    it('should throw a type error if a model is not provided', function(done) {
      expect(fixture).to.throw(TypeError, `Cannot read property 'modelName' of undefined`);
      expect(() => {
        fixture({ modelName: 'user' });
      }).to.throw(TypeError, 'Model is not a constructor');
      done();
    });
    it('should return a Result object when no generator is found.', function(done) {
      const result = fixture({ modelName: 'some-thing-that-does-not-exist' });
      testObjType(result);
      expect(result.length).to.equal(0);
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
