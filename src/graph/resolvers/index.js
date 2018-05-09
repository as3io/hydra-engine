const deepAssign = require('deep-assign');
const { DateType, CursorType } = require('@limit0/graphql-custom-types');

const key = require('./key');
const user = require('./user');
const organization = require('./organization');
const project = require('./project');
const content = require('./content');

module.exports = deepAssign(
  key,
  user,
  organization,
  project,
  content,
  {
    /**
     *
     */
    Date: DateType,
    Cursor: CursorType,

    /**
     *
     */
    Query: {
      /**
       *
       */
      ping: () => 'pong',
    },
  },
);
