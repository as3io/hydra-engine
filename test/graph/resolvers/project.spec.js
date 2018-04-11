require('../../connections');
const { graphql, setup, teardown } = require('./utils');
const ProjectRepo = require('../../../src/repositories/project');
const OrgRepo = require('../../../src/repositories/organization');
const { CursorType } = require('../../../src/graph/custom-types');

const createOrganization = async () => {
  const results = await OrgRepo.seed();
  return results.one();
};

const createProject = async () => {
  const results = await ProjectRepo.seed();
  return results.one();
};

const createProjects = async (count) => {
  const results = await ProjectRepo.seed({ count });
  return results.all();
};

describe('graph/resolvers/project', function() {
  before(async function() {
    await setup();
    await ProjectRepo.remove();
  });
  after(async function() {
    await teardown();
    await ProjectRepo.remove();
  });

  describe('Query', function() {

    describe('project', function() {
      let project;
      before(async function() {
        project = await createProject();
      });

      const query = `
        query Project($input: ModelIdInput!) {
          project(input: $input) {
            id
            name
            updatedAt
            createdAt
            organization {
              id
              name
            }
          }
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'project', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject if no record was found.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'project', loggedIn: true })).to.be.rejectedWith(Error, `No project record found for ID ${id}.`);
      });
      it('should return the requested project.', async function() {
        const id = project.id;
        const input = { id };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'project', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id', id);
        const data = await promise;
        expect(data).to.have.all.keys('id', 'name', 'updatedAt', 'createdAt', 'organization');
      });
    });

    describe('allProjects', function() {
      let projects;
      before(async function() {
        await ProjectRepo.remove();
        projects = await createProjects(10);
      });
      after(async function() {
        await ProjectRepo.remove();
      });
      const query = `
        query allProjects($pagination: PaginationInput, $sort: ProjectSortInput) {
          allProjects(pagination: $pagination, sort: $sort) {
            totalCount
            edges {
              node {
                id
                name
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
      it('should reject when no user is logged-in.', async function() {
        await expect(graphql({ query, key: 'allProjects', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should return five projects out of ten.', async function() {
        const pagination = { first: 5 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allProjects', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(5);
        expect(data.pageInfo.hasNextPage).to.be.true;
        expect(data.pageInfo.endCursor).to.be.a('string');

        const last = data.edges.pop();
        expect(data.pageInfo.endCursor).to.equal(last.cursor);
      });
      it('should should not have a next page when limited by more than the total.', async function() {
        const pagination = { first: 50 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allProjects', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(10);
        expect(data.pageInfo.hasNextPage).to.be.false;
        expect(data.pageInfo.endCursor).to.be.null;
      });
      it('should return an error when an after cursor is requested that does not exist.', async function() {
        const after = CursorType.serialize('507f1f77bcf86cd799439011');
        const pagination = { first: 5, after };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allProjects', variables, loggedIn: true });
        await expect(promise).to.be.rejectedWith(Error, `No record found for cursor '${after}'.`);
      });
    });

  });

  describe('Mutation', function() {

    describe('createProject', function() {
      const query = `
        mutation createProject($input: CreateProjectInput!) {
          createProject(input: $input) {
            id
            name
            updatedAt
            createdAt
            organization {
              id
              name
            }
          }
        }
      `;
      const payload = {
        name: 'Test Project',
      };

      it('should reject when no user is logged-in.', async function() {
        const input = { payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'createProject', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should create the project', async function() {
        const organization = await createOrganization();
        payload.organization = organization.id;
        const input = { payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'createProject', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        await expect(ProjectRepo.findById(data.id)).to.eventually.be.an('object');
      });
    });

    describe('updateProject', function() {
      let project;
      before(async function() {
        project = await createProject();
      });

      const query = `
        mutation UpdateProject($input: UpdateProjectInput!) {
          updateProject(input: $input) {
            id
            name
            createdAt
            updatedAt
            organization {
              id
              name
            }
          }
        }
      `;
      const payload = {
        name: 'Updated Project Name',
      };

      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateProject', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the project record is not found.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateProject', loggedIn: true })).to.be.rejectedWith(Error, `Unable to update project: no record was found for ID '${id}'`);
      });
      it('should update the project.', async function() {
        const id = project.id;
        const input = { id, payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'updateProject', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        expect(data.name).to.equal(payload.name);
        await expect(ProjectRepo.findById(data.id)).to.eventually.be.an('object').with.property('name', payload.name);
      });
    });

  });
});
