const Token = require('../../src/models/token');
const { testUniqueField, testRequiredField, testTrimmedField } = require('./utils');

const generateToken = () => new Token({ action: 'some-action', payload: { jti: '1234' } });

describe('models/token', function() {
  let token;
  beforeEach(function() {
    token = generateToken();
  });

  afterEach(async function() {
    await Token.remove();
  });

  describe('.action', function() {
    ['', ' ', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(token, 'action', value);
      });
    });
    it('should be trimmed.', function() {
      return testTrimmedField(token, 'action');
    });
  });

  describe('.payload', function() {
    describe('.jti', function() {
      it('should be unique', async function() {
        const another = generateToken();
        await testUniqueField(token, another, 'payload.jti');
      });
    });
  });
});
