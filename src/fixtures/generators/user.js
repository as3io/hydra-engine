const faker = require('faker');

module.exports = () => {
  const now = new Date();
  return {
    email: faker.internet.email(),
    password: faker.internet.password(8, true),
    api: {},
    givenName: faker.name.firstName(),
    familyName: faker.name.lastName(),
    logins: faker.random.number({ min: 0, max: 100 }),
    lastLoggedInAt: faker.date.past(),
    isEmailVerified: faker.random.boolean(),
    photoURL: faker.internet.avatar(),
    createdAt: now,
    updatedAt: now,
  };
};
