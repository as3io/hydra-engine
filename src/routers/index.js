const graph = require('./graph');
const content = require('./content');

module.exports = (app) => {
  app.use('/graph', graph);
  app.use('/content', content);
};
