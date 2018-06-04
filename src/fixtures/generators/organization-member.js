const faker = require('faker');

const roles = [
  'Owner',
  'Administrator',
  'Member',
];

module.exports = ({ userId, organizationId, projectId }) => ({
  userId: userId(),
  organizationId: organizationId(),
  role: faker.random.arrayElement(roles),
  projectRoles: [{
    projectId: projectId(),
    role: faker.random.arrayElement(roles),
  }],
  acceptedAt: faker.date.past(),
  invitedAt: faker.date.past(),
});
