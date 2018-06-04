require('../connections');
const Organization = require('../../src/models/organization');
const Project = require('../../src/models/project');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField, testRefOne } = require('./utils');

const generateOrganization = () => fixtures(Organization, 1).one();
const generateProject = async () => {
  const organization = await generateOrganization().save();

  const organizationId = () => organization.id;
  return fixtures(Project, 1, { organizationId }).one();
};

describe('models/project', function() {
  before(async function() {
    await Organization.remove();
    await Project.remove();
  });

  let project;
  beforeEach(async function() {
    project = await generateProject();
  });

  afterEach(async function() {
    await Organization.remove();
    await Project.remove();
  });


  it('should successfully save.', async function() {
    await expect(project.save()).to.be.fulfilled;
  });

  describe('.name', async () => {
    ['', ' ', null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'.`, function() {
        return testRequiredField(project, 'name', value);
      });
    });
    it('should be trimmed.', function() {
      return testTrimmedField(project, 'name');
    });
  });

  describe('.description', async () => {
    it('should be trimmed.', function() {
      return testTrimmedField(project, 'description');
    });
  });

  describe('.organizationId', async () => {
    [null, undefined].forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'.`, function() {
        return testRequiredField(project, 'organizationId', value);
      });
    });
    it('should reject when the organization ID cannot be found.', function() {
      const id = '5b1050d68dd51b05976c9dbf';
      return testRefOne(project, 'organizationId', id, `No organization found for ID ${id}`);
    });
  });

});
