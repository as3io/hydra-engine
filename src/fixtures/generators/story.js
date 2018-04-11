const faker = require('faker');
const slug = require('slug');

module.exports = () => {
  const title = faker.commerce.productName();
  return {
    title: faker.commerce.productName(),
    slug: slug(title),
    body: faker.lorem.paragraphs(5),
  };
};
