require('../../connections');
const { graphql, setup, teardown } = require('./utils');
const StoryRepo = require('../../../src/repositories/story');
const { CursorType } = require('@limit0/graphql-custom-types');

const createStory = async () => {
  const results = await StoryRepo.seed();
  return results.one();
};

const createStories = async (count) => {
  const results = await StoryRepo.seed({ count });
  return results.all();
};

describe('graph/resolvers/story', function() {
  before(async function() {
    await setup();
    await StoryRepo.remove();
  });
  after(async function() {
    await teardown();
    await StoryRepo.remove();
  });

  describe('Query', function() {

    describe('story', function() {
      let story;
      before(async function() {
        story = await createStory();
      });

      const query = `
        query Story($input: ModelIdInput!) {
          story(input: $input) {
            id
            title
            slug
            text
            createdAt
            updatedAt
          }
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'story', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject if no record was found.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'story', loggedIn: true })).to.be.rejectedWith(Error, `No story record found for ID ${id}.`);
      });
      it('should return the requested story.', async function() {
        const id = story.id;
        const input = { id };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'story', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id', id);
        const data = await promise;
        expect(data).to.have.all.keys('id', 'title', 'slug', 'text', 'updatedAt', 'createdAt');
      });
    });

    describe('allStories', function() {
      let storys;
      before(async function() {
        await StoryRepo.remove();
        storys = await createStories(10);
      });
      after(async function() {
        await StoryRepo.remove();
      });
      const query = `
        query AllStories($pagination: PaginationInput, $sort: StorySortInput) {
          allStories(pagination: $pagination, sort: $sort) {
            totalCount
            edges {
              node {
                id
                title
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        await expect(graphql({ query, key: 'allStories', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should return five storys out of ten.', async function() {
        const pagination = { first: 5 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allStories', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(5);
        expect(data.pageInfo.hasNextPage).to.be.true;
        expect(data.pageInfo.endCursor).to.be.a('string');

        const last = data.edges.pop();
        expect(data.pageInfo.endCursor).to.equal(last.cursor);
      });
    });

  });

  describe('Mutation', function() {

    describe('createStory', function() {
      const query = `
        mutation CreateStory($input: CreateStoryInput!) {
          createStory(input: $input) {
            id
            title
            slug
            text
            createdAt
            updatedAt
          }
        }
      `;
      const payload = {
        title: 'Test Story',
      };

      it('should reject when no user is logged-in.', async function() {
        const input = { payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'createStory', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should create the story.', async function() {
        const input = { payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'createStory', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        await expect(StoryRepo.findById(data.id)).to.eventually.be.an('object');
      });
    });

    describe('updateStory', function() {
      let story;
      before(async function() {
        story = await createStory();
      });

      const query = `
        mutation UpdateStory($input: UpdateStoryInput!) {
          updateStory(input: $input) {
            id
            title
            slug
            text
            createdAt
            updatedAt
          }
        }
      `;
      const payload = {
        title: 'Updated Story Name',
      };

      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateStory', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the story record is not found.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateStory', loggedIn: true })).to.be.rejectedWith(Error, `Unable to update story: no story was found for ID "${id}"`);
      });
      it('should update the story.', async function() {
        const id = story.id;
        const input = { id, payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'updateStory', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        expect(data.name).to.equal(payload.name);
        await expect(StoryRepo.findById(data.id)).to.eventually.be.an('object').with.property('title', payload.title);
      });
    });

  });
});
