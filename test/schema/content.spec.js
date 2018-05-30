require('../connections');
const Content = require('../../src/models/content');
const ProjectRepo = require('../../src/repositories/project');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testRequiredField, testUnTrimmedField, stubHash } = require('../utils');

const generateContent = async () => {
  const project = await ProjectRepo.seed();
  const params = {
    projectId: () => project.one().id,
  };
  return fixtures(Content, 1, params).one();
};

describe('schema/content', function() {
  let stub;
  before(function() {
    stub = stubHash();
    return Content.remove();
  });
  after(function() {
    stub.restore();
    return Content.remove();
  });
  it('should successfully save', async () => {
    const content = await generateContent();
    await expect(content.save()).to.be.fulfilled;
  });

  describe('#title', async () => {
    let content;
    beforeEach(async () => {
      content = await generateContent();
    });
    it('should be trimmed', function() {
      return testTrimmedField(Content, content, 'title', { value: ' Some Awesome Title  ', expected: 'Some Awesome Title' });
    });
  });

  describe('#slug', async () => {
    let content;
    beforeEach(async () => {
      content = await generateContent();
    });
    it('should be slugged', function() {
      return testTrimmedField(Content, content, 'slug', { value: ' This is a title ', expected: 'this-is-a-title' });
    })
  });

  describe('#text', async () => {
    let content;
    beforeEach(async () => {
      content = await generateContent();
    });
    it('should not be trimmed', function() {
      return testUnTrimmedField(Content, content, 'text');
    });
  });

  describe('#teaser', async () => {
    let content;
    beforeEach(async () => {
      content = await generateContent();
    });
    it('should not be trimmed', function() {
      return testUnTrimmedField(Content, content, 'teaser');
    });
  });

  describe('#published', async () => {
    let content;
    beforeEach(async () => {
      content = await generateContent();
    });
    it('should be required', function() {
      return testRequiredField(Content, content, 'published');
    });
    it('should default to `false`', function() {
      expect(content.get('published')).to.equal(false);
    });
  });

});
