const deepAssign = require('deep-assign');
const { DateType, CursorType } = require('@limit0/graphql-custom-types');

const user = require('./user');
const organization = require('./organization');
const project = require('./project');
const story = require('./story');

module.exports = deepAssign(
  user,
  organization,
  project,
  story,
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
