require('../connections');
const Organization = require('../../src/models/organization');
const Project = require('../../src/models/project');
const fixtures = require('../../src/fixtures');
const { testTrimmedField, testUniqueField, testRequiredField, stubHash } = require('../utils');

const bcryptRegex = /^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9\.\/]{53}$/;
const generateOrganization = () => fixtures(Organization, 1).one();
const generateProject = ({ organizationId }) => fixtures(Project, 1, { organizationId }).one();

describe('schema/project', function() {
  let stub;
  before(function() {
    stub = stubHash();
    return Project.remove();
  });
  after(function() {
    stub.restore();
    return Project.remove();
  });
  it('should successfully save.', async function() {
    const organization = await generateOrganization().save();
    const project = generateProject({
      organizationId: () => organization.id
    });
    await expect(project.save()).to.be.fulfilled;
  });

  describe('#name', function() {
    let project;
    beforeEach(async function() {
      const organization = await generateOrganization().save();
      project = generateProject({
        organizationId: () => organization.id,
      });
    });
    it('should not be trimmed.', function() {
      return testTrimmedField(Project, project, 'name', { value: ' foo@bar.com  ', expected: ' foo@bar.com  ' });
    });
    const values = ['', null, undefined];
    values.forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Project, project, 'name', value);
      });
    });
  });

  describe('#organization', function() {
    it('should be a valid org.', async function() {
      const project = generateProject({
        organizationId: () => 1234
      });
      await expect(project.save()).to.not.be.fulfilled;
    });
  });

});
