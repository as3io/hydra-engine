require('../connections');
const Project = require('../../src/models/project');
const { Pagination } = require('@limit0/mongoose-graphql-pagination');

describe('plugins/paginable', function() {
  describe('#paginate', function() {
    it('should return a Pagination instance.', async function() {
      expect(Project.paginate()).to.be.an.instanceOf(Pagination);
      expect(Project.paginate({})).to.be.an.instanceOf(Pagination);
    });
  });
});
