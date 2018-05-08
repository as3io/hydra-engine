const sinon = require('sinon');
const bcrypt = require('bcrypt');
const { graphql } = require('graphql');
const schema = require('../../../src/content/schema');
const Auth = require('../../../src/classes/api-auth');

const ProjectRepo = require('../../../src/repositories/project');
const Key = require('../../../src/models/key');

const sandbox = sinon.createSandbox();

let project;
let privateKey;
let publicKey;

const getProject = async () => {
  if (!project) {
    project = await ProjectRepo.seed();
    project = project.one();
  }
  return project;
};

const getPrivateKey = async () => {
  if (!privateKey) {
    project = await getProject();
    privateKey = await Key.create({
      project: project.id,
      scope: 'Project',
      purpose: 'Private',
    });
  }
  return privateKey;
};

const getPublicKey = async () => {
  if (!publicKey) {
    project = await getProject();
    publicKey = await Key.create({
      project: project.id,
      scope: 'Project',
      purpose: 'Public',
    });
  }
  return publicKey;
};

const buildContext = async ({ apiKey, canWrite, canRead } = {}) => {
  const key = (apiKey) ? apiKey : (canWrite) ? await getPrivateKey() : (canRead) ? await getPublicKey() : null;
  const auth = new Auth({ key });
  return { auth };
};

module.exports = {
  async setup() {
    await ProjectRepo.remove();
    await Key.remove({});
    await getPublicKey();
  },
  async teardown() {
    sandbox.restore();
    await ProjectRepo.remove();
    await Key.remove({});
  },
  async graphql({ query, variables, key, apiKey, canRead, canWrite }) {
    const contextValue = await buildContext({ apiKey, canRead, canWrite });
    return graphql({ schema, source: query, variableValues: variables, contextValue })
      .then((response) => {
        if (response.errors) throw response.errors[0];
        return response.data[key];
      });
  },
  getProject,
  getPrivateKey,
  getPublicKey,
  getType(name) {
    return schema._typeMap[name];
  },
}
