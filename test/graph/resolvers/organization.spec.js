// require('../../connections');
// const { graphql, setup, teardown } = require('./utils');
// const OrganizationRepo = require('../../../src/repositories/organization');
// const { CursorType } = require('@limit0/graphql-custom-types');

// const createOrganization = async () => {
//   const results = await OrganizationRepo.seed();
//   return results.one();
// };

// const createOrganizations = async (count) => {
//   const results = await OrganizationRepo.seed({ count });
//   return results.all();
// };

// describe('graph/resolvers/organization', function() {
//   before(async function() {
//     await setup();
//     await OrganizationRepo.remove();
//   });
//   after(async function() {
//     await teardown();
//     await OrganizationRepo.remove();
//   });

//   describe('Query', function() {

//     describe('organization', function() {
//       let organization;
//       before(async function() {
//         organization = await createOrganization();
//       });

//       const query = `
//         query Organization($input: ModelIdInput!) {
//           organization(input: $input) {
//             id
//             name
//             updatedAt
//             createdAt
//             members {
//               user {
//                 id
//                 givenName
//                 familyName
//                 email
//               }
//               role
//               projects {
//                 project {
//                   id
//                   name
//                 }
//                 role
//               }
//             }
//             projects {
//               id
//               name
//             }
//           }
//         }
//       `;
//       it('should reject when no user is logged-in.', async function() {
//         const id = '507f1f77bcf86cd799439011';
//         const input = { id };
//         const variables = { input };
//         await expect(graphql({ query, variables, key: 'organization', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
//       });
//       it('should reject if no record was found.', async function() {
//         const id = '507f1f77bcf86cd799439011';
//         const input = { id };
//         const variables = { input };
//         await expect(graphql({ query, variables, key: 'organization', loggedIn: true })).to.be.rejectedWith(Error, `No organization record found for ID ${id}.`);
//       });
//       it('should return the requested organization.', async function() {
//         const id = organization.id;
//         const input = { id };
//         const variables = { input };
//         const promise = graphql({ query, variables, key: 'organization', loggedIn: true });
//         await expect(promise).to.eventually.be.an('object').with.property('id', id);
//         const data = await promise;
//         expect(data).to.have.all.keys('id', 'name', 'updatedAt', 'createdAt', 'members', 'projects');
//       });
//     });

//     describe('allOrganizations', function() {
//       let organizations;
//       before(async function() {
//         await OrganizationRepo.remove();
//         organizations = await createOrganizations(10);
//       });
//       after(async function() {
//         await OrganizationRepo.remove();
//       });
//       const query = `
//         query allOrganizations($pagination: PaginationInput, $sort: OrganizationSortInput) {
//           allOrganizations(pagination: $pagination, sort: $sort) {
//             totalCount
//             edges {
//               node {
//                 id
//                 name
//                 createdAt
//                 updatedAt
//               }
//               cursor
//             }
//             pageInfo {
//               hasNextPage
//               endCursor
//             }
//           }
//         }
//       `;
//       it('should reject when no user is logged-in.', async function() {
//         await expect(graphql({ query, key: 'allOrganizations', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
//       });
//       it('should return five organizations out of ten.', async function() {
//         const pagination = { first: 5 };
//         const variables = { pagination };
//         const promise = graphql({ query, key: 'allOrganizations', variables, loggedIn: true });
//         await expect(promise).to.eventually.be.an('object');
//         const data = await promise;
//         expect(data.totalCount).to.equal(10);
//         expect(data.edges.length).to.equal(5);
//         expect(data.pageInfo.hasNextPage).to.be.true;
//         expect(data.pageInfo.endCursor).to.be.a('string');

//         const last = data.edges.pop();
//         expect(data.pageInfo.endCursor).to.equal(last.cursor);
//       });
//     });

//   });

//   describe('Mutation', function() {

//     describe('createOrganization', function() {
//       const query = `
//         mutation createOrganization($input: CreateOrganizationInput!) {
//           createOrganization(input: $input) {
//             id
//             name
//             updatedAt
//             createdAt
//             members {
//               user {
//                 id
//                 email
//               }
//               role
//               projects {
//                 project {
//                   id
//                   name
//                 }
//                 role
//               }
//             }
//           }
//         }
//       `;
//       const payload = {
//         name: 'Test Organization',
//       };

//       it('should reject when no user is logged-in.', async function() {
//         const input = { payload };
//         const variables = { input };
//         await expect(graphql({ query, variables, key: 'createOrganization', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
//       });
//       it('should create the organization.', async function() {
//         const input = { payload };
//         const variables = { input };
//         const promise = graphql({ query, variables, key: 'createOrganization', loggedIn: true });
//         await expect(promise).to.eventually.be.an('object').with.property('id');
//         const data = await promise;
//         await expect(OrganizationRepo.findById(data.id)).to.eventually.be.an('object');
//       });
//     });

//     describe('updateOrganization', function() {
//       let organization;
//       before(async function() {
//         organization = await createOrganization();
//       });

//       const query = `
//         mutation UpdateOrganization($input: UpdateOrganizationInput!) {
//           updateOrganization(input: $input) {
//             id
//             name
//             createdAt
//             updatedAt
//           }
//         }
//       `;
//       const payload = {
//         name: 'Updated Organization Name',
//       };

//       it('should reject when no user is logged-in.', async function() {
//         const id = '507f1f77bcf86cd799439011'
//         const input = { id, payload };
//         const variables = { input };
//         await expect(graphql({ query, variables, key: 'updateOrganization', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
//       });
//       it('should reject when the organization record is not found.', async function() {
//         const id = '507f1f77bcf86cd799439011'
//         const input = { id, payload };
//         const variables = { input };
//         await expect(graphql({ query, variables, key: 'updateOrganization', loggedIn: true })).to.be.rejectedWith(Error, `Unable to update organization: no record was found for ID '${id}'`);
//       });
//       it('should update the organization.', async function() {
//         const id = organization.id;
//         const input = { id, payload };
//         const variables = { input };
//         const promise = graphql({ query, variables, key: 'updateOrganization', loggedIn: true });
//         await expect(promise).to.eventually.be.an('object').with.property('id');
//         const data = await promise;
//         expect(data.name).to.equal(payload.name);
//         await expect(OrganizationRepo.findById(data.id)).to.eventually.be.an('object').with.property('name', payload.name);
//       });
//     });

//   });
// });
