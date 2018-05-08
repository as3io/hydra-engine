const Auth = require('../../src/classes/api-auth');
const Key = require('../../src/models/key');
const Project = require('../../src/models/project');
const fixtures = require('../../src/fixtures');

const key = {
  scope: 'Project',
  purpose: 'Private',
  project: '1234',
};
const simpleAuth = new Auth({ key });

const errs = [new Error('foo'), true, 'Some error text'];

describe('classes/api-auth', function() {
  describe('#getError', function() {
    it('should respond to the function', function() {
      expect(simpleAuth).to.respondsTo('getError');
    });
    it('should return an Error value when an error has been set', function(done) {
      errs.forEach((err) => {
        const auth = new Auth({ key, err });
        expect(auth.getError()).to.be.an.instanceof(Error);
      });
      done();
    });
    it('should return an Error value when a key is not present', function(done) {
      const auth = new Auth({ key: null });
      expect(auth.getError()).to.be.an.instanceof(Error);
      done();
    });
    it('should return an Error value when a non-project key is used', function(done) {
      const auth = new Auth({ key: { value: 'blah' } });
      expect(auth.getError()).to.be.an.instanceof(Error);
      done();
    });
    it('should return null when no error conditions have been found', function(done) {
      const auth = new Auth({ key });
      expect(auth.getError()).to.be.null;
      done();
    });
    it('should return null when no arguments are passed', function(done) {
      const auth = new Auth();
      expect(auth.getError()).to.be.an.instanceof(Error);
      done();
    });
  });
  describe('#isValid', function() {
    it('should respond to the function', function() {
      expect(simpleAuth).to.respondsTo('isValid');
    });
    it('should return false when an error condition is found', function(done) {
      const auth = new Auth({ key });
      errs.forEach((err) => {
        auth.err = err;
        expect(auth.isValid()).to.be.false;
      });
      auth.err = '';

      done();
    });
    it('should return true when no error conditions have been found', function(done) {
      const auth = new Auth({ key });
      expect(auth.isValid()).to.be.true;
      done();
    });
  });
  describe('#check', function() {
    it('should respond to the function', function() {
      expect(simpleAuth).to.respondsTo('check');
    });
    it('should throw an Error value when an error has been set', function(done) {
      const auth = new Auth({ key });
      errs.forEach((err) => {
        auth.err = err;
        expect(auth.check.bind(auth)).to.throw(Error);
      });
      done();
    });

    it('should return an Error value when a key is not present', function(done) {
      const auth = new Auth({ key: null });
      expect(auth.getError()).to.be.an.instanceof(Error);
      done();
    });
    it('should return an Error value when a non-project key is used', function(done) {
      const auth = new Auth({ key: { value: 'blah' } });
      expect(auth.getError()).to.be.an.instanceof(Error);
      done();
    });
    it('should return true (and not throw) when no error conditions have been found', function(done) {
      const auth = new Auth({ key });
      expect(auth.check.bind(auth)).to.not.throw();
      expect(auth.check()).to.be.true;
      done();
    });
  });
});
