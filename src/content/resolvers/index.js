const { DateType } = require('@limit0/graphql-custom-types');

const Content = require('../../models/content');

module.exports = {
  /**
   *
   */
  Date: DateType,

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createContent: (root, { input }, { auth }) => {
      auth.canWrite();
      const { project } = auth;
      const { payload } = input;
      payload.project = project;
      return Content.create(payload);
    },
    /**
     *
     */
    updateContent: async (root, { input }, { auth }) => {
      auth.canWrite();
      const { project } = auth;
      const { id, payload } = input;
      const criteria = { _id: id, project };
      const model = await Content.findOne(criteria);
      if (!model) throw new Error(`Unable to find content via id "${id}." (Project ${project})`);
      if (payload.title) model.title = payload.title;
      if (payload.teaser) model.teaser = payload.teaser;
      if (payload.slug) model.slug = payload.slug;
      if (payload.text) model.text = payload.text;
      return model.save();
    },
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    ping: () => 'pong',

    /**
     *
     */
    content: async (root, { input }, { auth }) => {
      auth.canRead();
      const { project } = auth;
      const criteria = {
        _id: input.id,
        project,
      };
      const model = await Content.findOne(criteria);
      if (!model) throw new Error(`Nothing found for id "${input.id}"`);
      return model;
    },

    /**
     *
     */
    contentSlug: async (root, { input }, { auth }) => {
      auth.canRead();
      const { project } = auth;
      const criteria = {
        slug: input.slug,
        project,
      };
      const model = await Content.findOne(criteria);
      if (!model) throw new Error(`Nothing found for slug "${input.slug}"`);
      return model;
    },
  },
};
