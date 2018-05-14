const faker = require('faker');
const slug = require('slug');

module.exports = ({ projectId }) => {
  const title = faker.commerce.productName();
  return {
    title: faker.commerce.productName(),
    slug: slug(title),
    teaser: faker.lorem.paragraphs(1),
    text: faker.lorem.paragraphs(5),
    project: projectId(),
    published: false,
  };
};
