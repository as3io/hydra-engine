const Model = require('../../models/key');
const Organization = require('../../models/organization');
const Project = require('../../models/project');
const User = require('../../models/user');

const create = async (auth, input, scope, ModelRef) => {
  auth.check();
  const { modelId } = input;
  const { purpose, description } = input.payload;
  const model = await ModelRef.findById(modelId);
  if (!model) throw new Error(`No ${scope} was found for id "${modelId}."`);
  const typeKey = scope.charAt(0).toLowerCase() + scope.slice(1);
  const payload = {
    enabled: true,
    scope,
    [typeKey]: model,
    purpose,
    description,
  };
  const key = await Model.create(payload);
  model.get('keys').push(key.id);
  await model.save();
  return key;
};

const update = async (auth, input) => {
  auth.check();
  const { purpose, description, enabled } = input.payload;
  const model = await Model.findById(input.modelId);
  if (!model) throw new Error(`No Key was found for id "${input.modelId}."`);
  model.purpose = purpose;
  model.enabled = enabled;
  model.description = description;
  return model.save();
};

module.exports = {
  /**
   *
   */
  Key: {
    // scopeTarget: (key) => {
    //   const { scope } = key;
    //   const ModelRef = scope.charAt(0).toUpperCase() + scope.slice(1);
    //   return [ModelRef].findById(key[scope]);
    // // switch (scope) {
    // //     case 'organization':
    // //       return Organization.findById(organization);
    // //     case 'project':
    // //       return Project.findById(project);
    // //     case 'user':
    // //       return auth.user;
    // //       const { uid } = auth.session;
    // //       return User.findById(uid);
    // //     default:
    // //       throw new Error(`Unknown key scope "${scope}!"`);
    // //   }
    // },
    // organization: ({ organization }) => Organization.findById(organization),
  },
  /**
   *
   */
  Mutation: {
    createProjectKey: async (root, { input }, { auth }) => create(auth, input, 'Project', Project),
    createOrganizationKey: async (root, { input }, { auth }) => create(auth, input, 'Organization', Organization),
    createUserKey: async (root, { input }, { auth }) => create(auth, input, 'User', User),
    updateProjectKey: async (root, { input }, { auth }) => update(auth, input),
    updateOrganizationKey: async (root, { input }, { auth }) => update(auth, input),
    updateUserKey: async (root, { input }, { auth }) => update(auth, input),
  },
};
