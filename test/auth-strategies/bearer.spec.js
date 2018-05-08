const sut = require('../../src/auth-strategies/bearer');
const { Strategy } = require('passport-http-bearer');
const User = require('../../src/repositories/user');
const Session = require('../../src/repositories/session');

describe('auth-strategies/bearer', function() {
  let token;
  before(async function() {
    const user = await User.create(User.generate().one());
    const session = await Session.set({ uid: user.id });
    token = session.token;
  })
  after(async function() {
    await User.remove();
  })
  it('should export an instance of a passport-http-bearer/strategy', () => {
    expect(sut).to.be.an.instanceof(Strategy);
  });
  it('should not accept an invalid token', (done) => {
    sut._verify('198237h129387fh1208uh1', (err, data) => {
      expect(err).to.be.an.instanceOf(Error).and.have.property('message', 'No active user session was found. Did you login?');
      done();
    });
  });
  it('should accept a valid token', (done) => {
    sut._verify(token, (err, { user, session }) => {
      expect(user).to.be.an('object').with.property('email');
      expect(session).to.be.an('object').with.property('exp');
      done();
    });
  });

});
