require('../connections');
const Repo = require('../../src/repositories/project');
const OrgRepo = require('../../src/repositories/organization');
const Model = require('../../src/models/project');
const Utils = require('../utils');

const createProject = async (organization) => {
  const results = await Repo.seed();
  return results.one();
};

describe('repositories/project', function() {
  before(function() {
    return Repo.remove();
  });
  after(function() {
    return Repo.remove();
  });
  it('should export an object.', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });

  describe('#create', function() {
    it('should return a rejected promise when validation fails.', async function() {
      await expect(Repo.create({})).to.be.rejectedWith(Error, /validation/i);
      await expect(Repo.create()).to.be.rejectedWith(Error, /validation/i);
    });
    it('should return a fulfilled promise with the model.', async function() {
      const organization = await OrgRepo.seed();
      const payload = Repo.generate(1, {
        organizationId: () => organization.one().id,
      }).one();
      const project = await Repo.create(payload);
      const found = await Repo.findById(project.get('id'));

      expect(found).to.be.an.instanceof(Model);
      expect(found).to.have.property('id').equal(project.get('id'));
    });
  });

  describe('#update', function() {
    let project;
    before(async function() {
      project = await createProject();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.update()).to.be.rejectedWith(Error, 'Unable to update project: no ID was provided.');
    });
    it('should return a rejected promise when the ID cannot be found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.update(id, { name: 'foo' })).to.be.rejectedWith(Error, `Unable to update project: no record was found for ID '${id}'`);
    });
    it('should return a rejected promise when valiation fails.', async function() {
      await expect(Repo.update(project.id)).to.be.rejectedWith(Error, /validation/i);
    });
    it('should save the updated name', async function() {
      const updated = await Repo.update(project.id, { name: 'Updated name.' });
      expect(updated).to.be.an('object');
      expect(updated).to.be.an.instanceof(Model).with.property('name').equal('Updated name.');
    });
    it('should save the updated organization', async function() {
      const organization = await OrgRepo.seed();
      const org = organization.one();
      const payload = {
        name: 'Updated name 2.',
        organization: org.id
      };
      const updated = await Repo.update(project.id, payload);
      expect(updated).to.be.an('object');
      expect(updated).to.be.an.instanceof(Model);
      expect(updated.organization + '').to.equal(org.id);
    });
  });

  describe('#findById', function() {
    let project;
    before(async function() {
      project = await createProject();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.findById()).to.be.rejectedWith(Error, 'Unable to find project: no ID was provided.');
    });
    it('should return a fulfilled promise with a `null` document when not found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.findById(id)).to.be.fulfilled.and.become(null);
    });
    it('should return a fulfilled promise with a document when found.', async function() {
      await expect(Repo.findById(project.get('id'))).to.be.fulfilled.and.eventually.be.an.instanceof(Model).with.property('id').equal(project.get('id'));
    });
  });

  describe('#find', function() {
    it('should return a promise.', async function() {
      await expect(Repo.find()).to.be.fulfilled.and.eventually.be.an('array');
    });
  });

  describe('#paginate', function() {
    it('should return a Pagination instance.', function(done) {
      Utils.testPaginate(Repo);
      done();
    })
  });

  describe('#search', function() {
    it('should return a Pagination instance.', function(done) {
      Utils.testSearch(Repo);
      done();
    })
  });

  describe('#generate', function() {
    it('should return a fixture result with one record.', function(done) {
      const results = Repo.generate(1, {
        organizationId: () => '1234',
      });
      expect(results).to.be.an('object');
      expect(results.length).to.equal(1);
      done();
    });
    it('should return a fixture result with the specified number of records.', function(done) {
      const results = Repo.generate(5, {
        organizationId: () => '1234',
      });
      expect(results).to.be.an('object');
      expect(results.length).to.equal(5);
      done();
    });
    it('should error when no organization is passed', function(done) {
      expect(Repo.generate).to.throw(TypeError);
      done();
    })
  });

  describe('#seed', function() {
    it('should generate and save the fixture data.', async function() {
      await expect(Repo.seed()).to.be.fulfilled.and.eventually.be.an('object');
      await expect(Repo.seed({ count: 2 })).to.be.fulfilled.and.eventually.be.an('object');
    });
  });

  describe('#removeById', function() {
    let project;
    before(async function() {
      project = await createProject();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.removeById()).to.be.rejectedWith(Error, 'Unable to remove project: no ID was provided.');
    });
    it('remove the requested project.', async function() {
      await expect(Repo.removeById(project.id)).to.be.fulfilled;
      await expect(Repo.findById(project.id)).to.be.fulfilled.and.eventually.be.null;
    });
  });
});
