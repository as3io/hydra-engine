require('../connections');
const Story = require('../../src/models/story');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUnTrimmedField, stubHash } = require('../utils');

const generateStory = () => fixtures(Story, 1).one();

describe('schema/story', function() {
  let stub;
  before(function() {
    stub = stubHash();
    return Story.remove();
  });
  after(function() {
    stub.restore();
    return Story.remove();
  });
  it('should successfully save.', async function() {
    const story = generateStory();
    await expect(story.save()).to.be.fulfilled;
  });

  describe('#title', function() {
    let story;
    beforeEach(function() {
      story = generateStory();
    });
    it('should be trimmed.', function() {
      return testTrimmedField(Story, story, 'title', { value: ' Some Awesome Title  ', expected: 'Some Awesome Title' });
    });
  });

  describe('#slug', function() {
    let story;
    beforeEach(function() {
      story = generateStory();
    });
    it('should be slugged.', function() {
      return testTrimmedField(Story, story, 'slug', { value: ' This is a title ', expected: 'this-is-a-title' });
    })
  });

  describe('#text', function() {
    let story;
    beforeEach(function() {
      story = generateStory();
    });
    it('should not be trimmed.', function() {
      return testUnTrimmedField(Story, story, 'text');
    });
  });

});
