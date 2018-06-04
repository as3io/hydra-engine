require('../connections');
const Story = require('../../src/models/story');
const ProjectRepo = require('../../src/repositories/project');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testRequiredField, testRefOne } = require('./utils');

const generateStory = async () => {
  const project = await ProjectRepo.seed();
  const params = {
    projectId: () => project.one().id,
  };
  return fixtures(Story, 1, params).one();
};

describe('models/story', function() {
  before(async function() {
    await Story.remove();
    await ProjectRepo.remove();
  });

  let story;
  beforeEach(async function() {
    story = await generateStory();
  });
  afterEach(async function() {
    await Story.remove();
    await ProjectRepo.remove();
  });

  it('should successfully save.', async () => {
    await expect(story.save()).to.be.fulfilled;
  });

  describe('.title', async () => {
    ['', ' ', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'.`, function() {
        return testRequiredField(story, 'title', value);
      });
    });
    it('should be trimmed.', function() {
      return testTrimmedField(story, 'title');
    });
  });

  describe('.teaser', async () => {
    it('should be trimmed.', function() {
      return testTrimmedField(story, 'teaser');
    });
  });

  describe('.body', async () => {
    it('should be trimmed.', function() {
      return testTrimmedField(story, 'body');
    });
  });

  describe('.published', async () => {
    [null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'.`, function() {
        return testRequiredField(story, 'published', value);
      });
    });
    it('should default to `false`', function(done) {
      const def = new Story();
      expect(def.published).to.equal(false);
      done();
    });
  });

  describe('.slug', async () => {
    ['', ' ', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'.`, function() {
        story.title = value;
        return testRequiredField(story, 'slug', value);
      });
    });
    it('should be trimmed.', function() {
      return testTrimmedField(story, 'slug', { value: ' This is a title ', expected: 'this-is-a-title' });
    });
    it('should use the title name if unset', async function() {
      story.title = 'Foo bar baz';
      story.slug = undefined;
      await story.save();
      expect(story.slug).to.equal('foo-bar-baz');
    });
  });

  describe('.projectId', async () => {
    [null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'.`, function() {
        return testRequiredField(story, 'projectId', value);
      });
    });
    it('should reject when the project ID cannot be found.', function() {
      const id = '5b1050d68dd51b05976c9dbf';
      return testRefOne(story, 'projectId', id, `No project found for ID ${id}`);
    });
  });
});
