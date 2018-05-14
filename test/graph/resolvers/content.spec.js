require('../../connections');
const { graphql, setup, teardown } = require('./utils');
const ContentRepo = require('../../../src/repositories/content');
const ProjectRepo = require('../../../src/repositories/project');
const { CursorType } = require('@limit0/graphql-custom-types');

const createContent = async () => {
  const results = await ContentRepo.seed();
  return results.one();
};

const createContents = async (count) => {
  const results = await ContentRepo.seed({ count });
  return results.all();
};

describe('graph/resolvers/content', function() {
  before(async function() {
    await setup();
    await ContentRepo.remove();
  });
  after(async function() {
    await teardown();
    await ContentRepo.remove();
  });

  describe('Query', function() {

    describe('content', function() {
      let content;
      before(async function() {
        content = await createContent();
      });

      const query = `
        query Content($input: ModelIdInput!) {
          content(input: $input) {
            id
            title
            slug
            published
            text
            createdAt
            updatedAt
          }
        }
      `;
      it('should reject when no user is logged-in', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'content', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject if no record was found', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'content', loggedIn: true })).to.be.rejectedWith(Error, `No content record found for ID ${id}.`);
      });
      it('should return the requested content', async function() {
        const id = content.id;
        const input = { id };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'content', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id', id);
        const data = await promise;
        expect(data).to.have.all.keys('id', 'title', 'slug', 'text', 'updatedAt', 'createdAt', 'published');
      });
    });

    describe('allContent', function() {
      let contents;
      before(async function() {
        await ContentRepo.remove();
        contents = await createContents(10);
      });
      after(async function() {
        await ContentRepo.remove();
      });
      const query = `
        query AllContent($pagination: PaginationInput, $sort: ContentSortInput) {
          allContent(pagination: $pagination, sort: $sort) {
            totalCount
            edges {
              node {
                id
                title
                published
                createdAt
                updatedAt
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
      it('should reject when no user is logged-in', async function() {
        await expect(graphql({ query, key: 'allContent', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should return five items out of ten', async function() {
        const pagination = { first: 5 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allContent', variables, loggedIn: true });
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

    describe('createContent', function() {
      let project;
      before(async function() {
        const seed = await ProjectRepo.seed();
        project = seed.one();
      })

      const query = `
        mutation CreateContent($input: CreateContentInput!) {
          createContent(input: $input) {
            id
            title
            slug
            published
            text
            createdAt
            updatedAt
          }
        }
      `;

      const payload = {
        title: 'Test Content',
      };

      it('should reject when no user is logged-in', async function() {
        const input = { payload, project: project.id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'createContent', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should create the content', async function() {
        const input = { project: project.id, payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'createContent', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        await expect(ContentRepo.findById(data.id)).to.eventually.be.an('object');
      });

      it('should not be published by default', async function() {
        const input = { project: project.id, payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'createContent', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('published', false);
      })

      it('should allow publishing on create', async function() {
        const newPayload = { published: true, title: payload.title };
        const input = { project: project.id, payload: newPayload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'createContent', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('published', true);
      })
    });

    describe('updateContent', function() {
      let content;
      before(async function() {
        content = await createContent();
      });

      const query = `
        mutation UpdateContent($input: UpdateContentInput!) {
          updateContent(input: $input) {
            id
            title
            slug
            published
            text
            createdAt
            updatedAt
          }
        }
      `;
      const payload = {
        title: 'Updated Content Name',
      };

      it('should reject when no user is logged-in', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateContent', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the content record is not found', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateContent', loggedIn: true })).to.be.rejectedWith(Error, `Unable to update content: no content was found for ID "${id}"`);
      });
      it('should update the content', async function() {
        const id = content.id;
        const input = { id, payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'updateContent', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        expect(data.name).to.equal(payload.name);
        await expect(ContentRepo.findById(data.id)).to.eventually.be.an('object').with.property('title', payload.title);
      });

      it('should allow modifying published status', async function() {
        const id = content.id;
        const published = true;
        const input = { id, payload: { published } };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'updateContent', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('published', true);
      })

    });

  });
});
