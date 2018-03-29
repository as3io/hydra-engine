require('../connections');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const router = require('../../src/routers/graph');
const UserRepo = require('../../src/repositories/user');
const sandbox = sinon.createSandbox();

describe('routers/graph', function() {
  it('should export a router function.', function(done) {
    expect(router).to.be.a('function');
    expect(router).itself.to.respondTo('use');
    done();
  });

  const successfulResponse = (res) => {
    const { body, status } = res;
    expect(res.get('Content-Type')).to.match(/json/i);
    expect(status).to.equal(200);
    expect(body).to.be.an('object').with.property('data');
    expect(body).to.not.have.property('errors');
  };

  describe('ping', function() {
    const query = `
      query Ping {
        ping
      }
    `;
    const properBody = ({ body }) => {
      const { data } = body;
      expect(data).to.be.an('object').with.property('ping').to.equal('pong');
    };
    it('should successfully respond to POST.', function(done) {
      request(app).post('/graph').send({ query })
        .expect(successfulResponse)
        .expect(properBody)
        .end(done);
    });
    it('should successfully respond to GET.', function(done) {
      // Used merely to confirm that graph will respond to GET requests.
      request(app).get('/graph').query({ query })
      .expect(successfulResponse)
      .expect(properBody)
      .end(done);
    });
  });
  describe('currentUser', function() {
    let token;
    before(async function() {
      const hash = '$2a$04$B9nI.XF/vfcZ4AfUTvmLcOHEwxrB4o9PDb0r1f9N3x3AqSFDTME4C';
      const password = 'test-password';

      sandbox.stub(bcrypt, 'hash').resolves(hash);
      sandbox.stub(bcrypt, 'compare').withArgs(password, hash).resolves(true);

      await UserRepo.remove();
      user = UserRepo.generate().one();
      user.set('password', password);
      await user.save();
      const { session } = await UserRepo.login(user.email, password);
      token = session.token;
    });
    after(async function() {
      sandbox.restore();
      await UserRepo.remove();
    });

    const query = `
      query CurrentUser {
        currentUser {
          id
        }
      }
    `;

    it('should successfully respond with the current user.', function(done) {
      request(app).post('/graph')
        .set('Authorization', `Bearer ${token}`)
        .send({ query })
        .expect(successfulResponse)
        .expect(({ body }) => {
          const { data } = body;
          expect(data).to.be.an('object').with.property('currentUser').deep.equal({ id: user.id });
        })
        .end(done);
    });

    it('should return a null current user when auth is invalid.', function(done) {
      request(app).post('/graph')
        .set('Authorization', `Bearer someinvalidtoken`)
        .send({ query })
        .expect(successfulResponse)
        .expect(({ body }) => {
          const { data } = body;
          expect(data).to.be.an('object').with.property('currentUser').equal(null);
        })
        .end(done);
    });
  });
});
