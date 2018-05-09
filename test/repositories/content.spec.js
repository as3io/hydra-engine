require('../connections');
const Repo = require('../../src/repositories/content');
const ProjectRepo = require('../../src/repositories/project');
const Model = require('../../src/models/content');
const Utils = require('../utils');

const createContent = async () => {
  const results = await Repo.seed();
  return results.one();
};

describe('repositories/content', function() {
  before(function() {
    return Repo.remove();
  });
  after(function() {
    return Repo.remove();
  });
  it('should export an object', function(done) {
    expect(Repo).to.be.an('object');
    done();
  });

  describe('#create', function() {
    it('should return a rejected promise when valiation fails', async function() {
      await expect(Repo.create({})).to.be.rejectedWith(Error, /validation/i);
      await expect(Repo.create()).to.be.rejectedWith(Error, /validation/i);
    });
    it('should return a fulfilled promise with the model', async function() {
      const seed = await ProjectRepo.seed();
      const project = seed.one();
      const payload = Repo.generate(1, {
        projectId: () => project.id,
      }).one();
      const content = await Repo.create(payload);
      const found = await Repo.findById(content.get('id'));

      expect(found).to.be.an.instanceof(Model);
      expect(found).to.have.property('id').equal(content.get('id'));
    });
  });

  describe('#update', function() {
    let content;
    before(async function() {
      content = await createContent();
    });
    it('should return a rejected promise when no ID is provided', async function() {
      await expect(Repo.update()).to.be.rejectedWith(Error, 'Unable to update content: no ID was provided.');
    });
    it('should return a rejected promise when the ID cannot be found', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.update(id, { title: 'foo' })).to.be.rejectedWith(Error, `Unable to update content: no content was found for ID "${id}"`);
    });
    it('should save the content even if no fields are passed', async function() {
      await expect(Repo.update(content.id)).to.be.fulfilled;
    });
    it('should return the updated model object', async function() {
      const updated = await Repo.update(content.id, { title: 'Updated title.' });
      expect(updated).to.be.an('object');
      expect(updated).to.be.an.instanceof(Model).with.property('title').equal('Updated title.');
    });
    it('should only modify the submitted fields', async function() {
      const updated = await Repo.update(content.id, { title: 'Updated title.' });
      expect(updated.teaser).to.equal(content.teaser);
    });
  });

  describe('#findById', function() {
    let content;
    before(async function() {
      content = await createContent();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.findById()).to.be.rejectedWith(Error, 'Unable to find content: no ID was provided.');
    });
    it('should return a fulfilled promise with a `null` document when not found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      await expect(Repo.findById(id)).to.be.fulfilled.and.become(null);
    });
    it('should return a fulfilled promise with a document when found.', async function() {
      await expect(Repo.findById(content.get('id'))).to.be.fulfilled.and.eventually.be.an.instanceof(Model).with.property('id').equal(content.get('id'));
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
      const results = Repo.generate(1, { projectId: () => '1234' });
      expect(results).to.be.an('object');
      expect(results.length).to.equal(1);
      done();
    });
    it('should return a fixture result with the specified number of records.', function(done) {
      const results = Repo.generate(5, { projectId: () => '1234' });
      expect(results).to.be.an('object');
      expect(results.length).to.equal(5);
      done();
    });
  });

  describe('#seed', function() {
    it('should generate and save the fixture data.', async function() {
      await expect(Repo.seed()).to.be.fulfilled.and.eventually.be.an('object');
      await expect(Repo.seed({ count: 2 })).to.be.fulfilled.and.eventually.be.an('object');
    });
  });

  describe('#removeById', function() {
    let content;
    before(async function() {
      content = await createContent();
    });
    it('should return a rejected promise when no ID is provided.', async function() {
      await expect(Repo.removeById()).to.be.rejectedWith(Error, 'Unable to remove content: no ID was provided.');
    });
    it('remove the requested content.', async function() {
      await expect(Repo.removeById(content.id)).to.be.fulfilled;
      await expect(Repo.findById(content.id)).to.be.fulfilled.and.eventually.be.null;
    });
  });
});
