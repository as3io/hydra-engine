require('../connections');
const User = require('../../src/models/user');
const UserRepo = require('../../src/repositories/user')
const Pagination = require('../../src/classes/pagination');

const createUsers = async (count) => {
  const results = await UserRepo.seed({ count });
  return results.all();
};

describe('classes/pagination', function() {
  let users;
  before(async function() {
    await UserRepo.remove();
    users = await createUsers(10);
  });
  after(async function() {
    await UserRepo.remove();
  });

  describe('#findCursorModel', function() {
    it('should find the appropriate model and fields.', async function() {
      const user = users[0];
      const paginated = new Pagination(User);
      const promise = paginated.findCursorModel(user.id, { _id: 1 });
      await expect(promise).to.eventually.be.an.instanceOf(User);
      const found = await promise;
      expect(found.id).to.equal(user.id);
      expect(found.name).to.be.undefined;
    });
    it('should throw an error when no model could be found.', async function() {
      const id = '507f1f77bcf86cd799439011';
      const paginated = new Pagination(User);
      await expect(paginated.findCursorModel(id)).to.be.rejectedWith(Error, /no record found/i);
    });
  });

  describe('#getEdges', function() {
    it('should return a natural list of models.', async function() {
      const ids = users.slice(0, 5).map(user => user.id);
      const sort = { field: 'id', order: 1 };
      const pagination = { first: 5 };
      const paginated = new Pagination(User, { sort, pagination });
      const promise = await expect(paginated.getEdges()).to.eventually.be.an('array');
      const results = await promise;
      expect(results.map(model => model.id)).to.deep.equal(ids);
    });
  });

  describe('#getFilter', function() {
    it('should return the proper filter value when no options are present.', async function(){
      const options = { };
      const expected = { };
      const paginated = new Pagination(User, options);
      // call it twice to simulate saved filter.
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
    });
    it('should return the proper filter value when an after value is present.', async function(){
      const user = users[0];
      const options = {
        pagination: { after: user.id },
      };
      const expected = {
        _id: { $gt: user.id },
      };
      const paginated = new Pagination(User, options);
      // call it twice to simulate saved filter.
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
    });
    it('should return the proper filter value when an after value is present (descending).', async function(){
      const user = users[0];
      const options = {
        pagination: { after: user.id },
        sort: { order: -1 },
      };
      const expected = {
        _id: { $lt: user.id },
      };
      const paginated = new Pagination(User, options);
      // call it twice to simulate saved filter.
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
    });
    it('should return the proper filter value when an after value is present, with a non-ID sort.', async function(){
      const user = users[0];
      const options = {
        pagination: { after: user.id },
        sort: { field: 'name' },
      };
      const expected = {
        $or: [
          { name: { $gt: user.name } },
          { name: user.name, _id: { $gt: user.id } },
        ],
      };
      const paginated = new Pagination(User, options);
      // call it twice to simulate saved filter.
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
    });
    it('should return the proper filter value when an after value is present, with a non-ID sort (descending).', async function(){
      const user = users[0];
      const options = {
        pagination: { after: user.id },
        sort: { field: 'name', order: -1 },
      };
      const expected = {
        $or: [
          { name: { $lt: user.name } },
          { name: user.name, _id: { $lt: user.id } },
        ],
      };
      const paginated = new Pagination(User, options);
      // call it twice to simulate saved filter.
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
    });
    it('should return the proper filter value when an after value is present, with a non-ID sort (descending), with additional criteria.', async function(){
      const user = users[0];
      const options = {
        criteria: { createdAt: user.createdAt },
        pagination: { after: user.id },
        sort: { field: 'name', order: -1 },
      };
      const expected = {
        createdAt: user.createdAt,
        $or: [
          { name: { $lt: user.name } },
          { name: user.name, _id: { $lt: user.id } },
        ],
      };
      const paginated = new Pagination(User, options);
      // call it twice to simulate saved filter.
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
      await expect(paginated.getFilter()).to.eventually.deep.equal(expected);
    });
  });

  describe('#getTotalCount', function() {
    [1, 10, 50].forEach((first) => {
      const pagination = { first };
      const paginated = new Pagination(User, { pagination });
      it(`should return a consistent total count when requesting ${first} records.`, async function() {
        await expect(paginated.getTotalCount()).to.eventually.equal(users.length);
      });
    });
  });

  describe('#hasNextPage', function() {
    [
      { first: 1, expected: true },
      { first: 5, expected: true },
      { first: 10, expected: false },
      { first: 15, expected: false },
    ].forEach(({ first, expected }) => {
      const pagination = { first };
      const paginated = new Pagination(User, { pagination });
      it(`should return ${expected} when requesting ${first} records.`, async function() {
        await expect(paginated.hasNextPage()).to.eventually.equal(expected);
      });
    });
    [
      { first: 1, expected: true },
      { first: 5, expected: true },
      { first: 10, expected: false },
      { first: 15, expected: false },
    ].forEach(({ first, expected }) => {
      const pagination = { first };
      const sort = { field: 'name', order: -1 };
      const paginated = new Pagination(User, { pagination, sort });
      it(`should return ${expected} when requesting ${first} records while sorting.`, async function() {
        await expect(paginated.hasNextPage()).to.eventually.equal(expected);
      });
    });
  });

  describe('#getEndCursor', function() {
    [1, 5, 10, 15].forEach((first) => {
      const pagination = { first };
      const paginated = new Pagination(User, { pagination });
      it(`should return the correct cursor value when requesting ${first} records while ascending.`, async function() {
        const expected = first > users.length ? null : users[first - 1].id;
        await expect(paginated.getEndCursor()).to.eventually.equal(expected);
      });
    });
    [1, 5, 10, 15].forEach((first) => {
      const pagination = { first };
      const sort = { order: -1 };
      const paginated = new Pagination(User, { pagination }, { sort });
      it(`should return the correct cursor value when requesting ${first} records while descending.`, async function() {
        const flipped = users.slice(0).reverse();
        const expected = first > users.length ? null : users[first - 1].id;
        await expect(paginated.getEndCursor()).to.eventually.equal(expected);
      });
    });
  });

  describe('#getSortOrder', function() {
    [-1, '-1', -1.1].forEach((value) => {
      it(`should return -1 when the value is '${value}'.`, function(done) {
        expect(Pagination.getSortOrder(value)).to.equal(-1);
        done();
      });
    });
    [1, 0, '1', 1.1, 2].forEach((value) => {
      it(`should return 1 when the value is '${value}'.`, function(done) {
        expect(Pagination.getSortOrder(value)).to.equal(1);
        done();
      });
    });
  });

  describe('#getSortOrder', function() {
    ['id', '_id', 'createdAt', '', undefined, null].forEach((value) => {
      it(`should return '_id' when the value is '${value}'.`, function(done) {
        expect(Pagination.getSortField(value)).to.equal('_id');
        done();
      });
    });
    ['name', 'updatedAt', 'foo', 'bar'].forEach((value) => {
      it(`should return '${value}' when passed.`, function(done) {
        expect(Pagination.getSortField(value)).to.equal(value);
        done();
      });
    });
  });

  describe('#getSortObject', function() {
    [
      { field: '_id', order: 1 },
      { field: '_id', order: -1 },
      { field: 'id', order: 1 },
      { field: 'id', order: -1 },
      { field: 'createdAt', order: 1 },
      { field: 'createdAt', order: -1 },
    ].forEach((sort) => {
      const expected = { _id: sort.order };
      it(`should return a sort object of ${JSON.stringify(expected)} when the input sort is ${JSON.stringify(sort)}.`, function(done) {
        const paginated = new Pagination(User, { sort });
        expect(paginated.getSortObject()).to.deep.equal(expected);
        done();
      });
    });
    [
      { field: 'name', order: 1 },
      { field: 'name', order: -1 },
    ].forEach((sort) => {
      const expected = { [sort.field]: sort.order, _id: sort.order };
      it(`should return a sort object of ${JSON.stringify(expected)} when the input sort is ${JSON.stringify(sort)}.`, function(done) {
        const paginated = new Pagination(User, { sort });
        expect(paginated.getSortObject()).to.deep.equal(expected);
        done();
      });
    });

  });

  describe('#parseSort', function() {
    it('should return a parsed object with field and order.', function() {
      expect(Pagination.parseSort()).to.be.an('object').with.all.keys('field', 'order');
      expect(Pagination.parseSort({ field: 'name', order: -1 })).to.be.an('object').with.all.keys('field', 'order');
    });
  });

  describe('#invertSortObj', function() {
    [
      { field: '_id', order: 1 },
      { field: '_id', order: -1 },
      { field: 'id', order: 1 },
      { field: 'id', order: -1 },
      { field: 'createdAt', order: 1 },
      { field: 'createdAt', order: -1 },
    ].forEach((sort) => {
      const expected = { _id: sort.order * -1 };
      it(`should return a sort object of ${JSON.stringify(expected)} when the input sort is ${JSON.stringify(sort)}.`, function(done) {
        const paginated = new Pagination(User, { sort });
        expect(paginated.invertSortObj()).to.deep.equal(expected);
        done();
      });
    });
    [
      { field: 'name', order: 1 },
      { field: 'name', order: -1 },
    ].forEach((sort) => {
      const expected = { [sort.field]: sort.order * -1, _id: sort.order * -1 };
      it(`should return a sort object of ${JSON.stringify(expected)} when the input sort is ${JSON.stringify(sort)}.`, function(done) {
        const paginated = new Pagination(User, { sort });
        expect(paginated.invertSortObj()).to.deep.equal(expected);
        done();
      });
    });
  });

  describe('#limit', function() {
    [undefined, null, 0, -1].forEach((value) => {
      it(`should return a default of 10 when the first value is '${value}'`, function(done) {
        const pagination = { first: value };
        const paginated = new Pagination(User, { pagination });
        expect(paginated.limit).to.equal(10);
        done();
      });
    });

    [5, '5', 5.5, 5.1, 5.9].forEach((value) => {
      it(`should return a limit of 5 when the first value is '${value}'`, function(done) {
        const pagination = { first: value };
        const paginated = new Pagination(User, { pagination });
        expect(paginated.limit).to.equal(5);
        done();
      });
    });

    [200, 201, 200.5, '201', 1000].forEach((value) => {
      it(`should return a max of 200 when the first value is '${value}'`, function(done) {
        const pagination = { first: value };
        const paginated = new Pagination(User, { pagination });
        expect(paginated.limit).to.equal(200);
        done();
      });
    });

  });

});
