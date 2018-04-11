const faker = require('faker');

module.exports = () => ({ name: faker.company.companyName() });
