require('../../connections');
const { getProject, getPublicKey, getPrivateKey, graphql } = require('./utils');
const Content = require('../../../src/models/content');
const Project = require('../../../src/models/project');

describe('content/resolvers', function() {
  describe('Query', function() {

    describe('ping', function() {
      const query = `
        query Ping {
          ping
        }
      `;
      it('should pong.', async function() {
        const data = await graphql({ query, key: 'ping' });
        expect(data).to.equal('pong');
      });
    });

    describe('content', function() {
      let content;
      let otherProject;
      let otherContent;

      before(async function () {
        await Content.remove({});
        const project = await getProject();
        content = await Content.create({
          title: 'Test Title ',
          project: project.id,
        });
        otherProject = await Project.create({
          name: 'Other Project',
          organization: project.organization,
        });
        otherContent = await Content.create({
          title: 'test 2 ',
          project: otherProject.id,
        });
      })

      after(async function () {
        await Content.remove({});
        otherProject.remove();
      })

      const query = `
        query content($input: ContentIdInput!) {
          content(input: $input) {
            id
            title
            teaser
            slug
            text
            createdAt
            updatedAt
          }
        }
      `;

      it('should throw an error when given an invalid api key', async function() {
        const variables = { input: { id: '5ade495e876c718a84ce5341' } };
        const promise = graphql({ query, variables, key: 'content', apiKey: null });
        await expect(promise).to.eventually.be.rejectedWith(Error, 'You must be logged-in to access this resource');
      });

      it('should throw an error when given a key without read access', async function() {
        const variables = { input: { id: '5ade495e876c718a84ce5341' } };
        const promise = graphql({ query, variables, key: 'content', canRead: false });
        await expect(promise).to.eventually.be.rejectedWith(Error, 'You must be logged-in to access this resource');
      });

      it('should reject when given an invalid identifier', async function() {
        const variables = { input: { id: '5ade495e876c718a84ce5341' } };
        const promise = graphql({ query, variables, key: 'content', canRead: true });
        await expect(promise).to.eventually.be.rejectedWith(Error, `Nothing found for id "5ade495e876c718a84ce5341"`);
      });
      it('should return content when given a valid identifier', async function() {
        const variables = { input: { id: content.id } };
        const promise = graphql({ query, variables, key: 'content', canRead: true });
        await expect(promise).to.eventually.be.fulfilled;
        const data = await promise;
        expect(data).to.include({
          id: content.id,
          title: content.title
        });
      });
      it('should only return content from the current project', async function() {
        const variables = { input: { id: otherContent.id } };
        const promise = graphql({ query, variables, key: 'content', canRead: true });
        await expect(promise).to.eventually.be.rejectedWith(Error, `Nothing found for id "${otherContent.id}"`);
      });
    });
    describe('contentSlug', function() {
      let content;
      let otherProject;
      let otherContent;

      before(async function () {
        await Content.remove();
        const project = await getProject();
        content = await Content.create({
          title: 'Test Title ',
          project: project.id,
        });
        otherProject = await Project.create({
          name: 'Other Project',
          organization: project.organization,
        });
        otherContent = await Content.create({
          title: 'test 2 ',
          project: otherProject.id,
        });
      })

      after(async function () {
        await Content.remove({});
        await otherProject.remove();
      })

      const query = `
        query contentSlug($input: ContentSlugInput!) {
          contentSlug(input: $input) {
            id
            title
            teaser
            slug
            text
            createdAt
            updatedAt
          }
        }
      `;
      it('should throw an error when given a key without read access', async function() {
        const variables = { input: { slug: '5ade495e876c718a84ce5341' } };
        const promise = graphql({ query, variables, key: 'contentSlug', apiKey: null });
        await expect(promise).to.eventually.be.rejectedWith(Error, 'You must be logged-in to access this resource');
      });
      it('should return content when given a valid slug', async function() {
        const variables = { input: { slug: content.slug } };
        const promise = graphql({ query, variables, key: 'contentSlug', canRead: true });
        await expect(promise).to.eventually.be.fulfilled;
        const data = await promise;
        expect(data).to.include({
          id: content.id,
          title: content.title
        });
      });
      it('should only return content from the current project.', async function() {
        const variables = { input: { slug: otherContent.slug } };
        const promise = graphql({ query, variables, key: 'content', canRead: true });
        await expect(promise).to.eventually.be.rejectedWith(Error, `Nothing found for slug "${otherContent.slug}"`);
      });
    });

  });

  describe('Mutation', function() {
    let otherProject;
    let otherContent;

    before(async function () {
      await Content.remove();
      const project = await getProject();
      content = await Content.create({
        title: 'Test Title ',
        project: project.id,
      });
      otherProject = await Project.create({
        name: 'Other Project',
        organization: project.organization,
      });
      otherContent = await Content.create({
        title: 'test 2 ',
        project: otherProject.id,
      });
    })

    after(async function () {
      await Content.remove({});
      await otherProject.remove();
    })

    const query = `
      mutation CreateContent($input: CreateContentInput!) {
        createContent(input: $input) {
          id
          title
          teaser
          slug
          text
          createdAt
          updatedAt
        }
      }
    `;
    describe('createContent', function() {
      it('should throw an error when given a key without read access', async function() {
        const payload = { title: 'Some new title' };
        const variables = { input: { payload } };
        const promise = graphql({ query, variables, key: 'createContent', apiKey: null });
        await expect(promise).to.eventually.be.rejectedWith(Error, 'You must be logged-in to access this resource');
      });
      it('should throw an error when given a key for a different project', async function() {
        const payload = { title: 'Some new title' };
        const variables = { input: { payload } };
        const promise = graphql({ query, variables, key: 'createContent', apiKey: { value: 1234, project: otherProject.id } });
        await expect(promise).to.eventually.be.rejectedWith(Error, 'You do not have access to write to this resource.');
      });
      it('should throw an error when given a key without read access', async function() {
        const payload = { title: 'Some new title' };
        const variables = { input: { payload } };
        const promise = graphql({ query, variables, key: 'createContent', canWrite: false });
        await expect(promise).to.eventually.be.rejectedWith(Error, 'You must be logged-in to access this resource');
      });
      it('should generate a slug if one is not provided', async function() {
        const payload = { title: 'Some new title' };
        const variables = { input: { payload } };
        const promise = graphql({ query, variables, key: 'createContent', canWrite: true });
        await expect(promise).to.eventually.be.fulfilled.and.have.property('slug');
      });
    });
    describe('updateContent', function() {
      let content;
      let otherProject;
      let otherContent;

      before(async function () {
        await Content.remove();
        const project = await getProject();
        content = await Content.create({
          title: 'Test Title ',
          project: project.id,
        });
        otherProject = await Project.create({
          name: 'Other Project',
          organization: project.organization,
        });
        otherContent = await Content.create({
          title: 'test 2 ',
          project: otherProject.id,
        });
      })

      after(async function () {
        await Content.remove({});
        await otherProject.remove();
      })

      const query = `
        mutation UpdateContent($input: UpdateContentInput!) {
          updateContent(input: $input) {
            id
            title
            teaser
            slug
            text
            createdAt
            updatedAt
          }
        }
      `;

      it('should throw an error when given a key without read access', async function() {
        const { id } = content;
        const payload = { title: 'Some new title' };
        const variables = { input: { id, payload } };
        const promise = graphql({ query, variables, key: 'updateContent', apiKey: null });
        await expect(promise).to.eventually.be.rejectedWith(Error, 'You must be logged-in to access this resource');
      });
      it('should throw an error when given a key for a different project', async function() {
        const { id } = content;
        const payload = { title: 'Some new title' };
        const variables = { input: { id, payload } };
        const promise = graphql({ query, variables, key: 'updateContent', apiKey: { value: 1234, project: otherProject.id } });
        await expect(promise).to.eventually.be.rejectedWith(Error, 'You do not have access to write to this resource.');
      });
      it('should throw an error when given a key without write access', async function () {
        const { id } = content;
        const payload = { title: 'Some new title' };
        const variables = { input: { id, payload } };
        const promise = graphql({ query, variables, key: 'updateContent', canWrite: false });
        await expect(promise).to.eventually.be.rejectedWith(Error, 'You must be logged-in to access this resource');
      });
      it('should generate a slug if one is not provided', async function () {
        const { id } = content;
        const payload = { title: 'Some new title' };
        const variables = { input: { id, payload } };
        const promise = graphql({ query, variables, key: 'updateContent', canWrite: true });
        await expect(promise).to.eventually.be.fulfilled.and.have.property('slug');
      });
      it('should update the slug if one is provided', async function () {
        const { id } = content;
        const suffix = Math.floor(Math.random() * 20);
        const payload = {
          title: `Some new title ${suffix}`,
          slug: `some-new-title-${suffix}`
        };
        const variables = { input: { id, payload } };
        const promise = graphql({ query, variables, key: 'updateContent', canWrite: true });
        await expect(promise).to.eventually.be.fulfilled.and.have.property('slug', payload.slug);
      });
      it('should update the content under the appropriate project', async function () {
        const { id } = content;
        const payload = { title: 'Some new title' };
        const variables = { input: { id, payload } };
        const promise = graphql({ query, variables, key: 'updateContent', canWrite: true });
        await expect(promise).to.eventually.be.fulfilled;
      });
      it('should error if the content belongs to a different project', async function () {
        const { id } = otherContent;
        const payload = { title: 'Some new title' };
        const variables = { input: { id, payload } };
        const promise = graphql({ query, variables, key: 'updateContent', apiKey: { value: 1234, project: otherProject.id } });
        await expect(promise).to.eventually.be.rejectedWith(Error, 'You do not have access to write to this resource.');
      });
    });
  });

});


// @todo get rid of the math.random shit -- update tests to error if the specified slug exists alreadt (dupe key)
// Update slug logic to apply suffix to slug when changing title but not changing slug?
