const faker = require('faker');

module.exports = ({ organizationId }) => ({
  name: faker.commerce.productName(),
  organization: organizationId(),
});
