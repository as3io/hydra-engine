require('../connections');
const Seed = require('../../src/fixtures/seed');
const Organization = require('../../src/models/organization');

const sandbox = sinon.createSandbox();

describe('plugins/repository', function() {
  let doc;
  beforeEach(async function() {
    doc = await Seed.organizations(1);
  });

  afterEach(async function() {
    await Organization.remove();
  });

  describe('#findAndSetUpdate', function() {
    beforeEach(async function() {
      sandbox.spy(Organization, 'findById');
      sandbox.stub(Organization.prototype, 'setUpdate').resolves('ok');
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should reject when no document could be found for the provided id.', async function() {
      const id = '5b1557bdb4889f01684ad517';
      await expect(Organization.findAndSetUpdate(id)).to.be.rejectedWith(Error, `Unable to update organization: no record was found for ID '${id}'`)
    });
    it('should reject when the id is not provided.', async function() {
      await expect(Organization.findAndSetUpdate()).to.be.rejectedWith(Error, `Unable to update organization: no record was found for ID 'undefined'`)
    });
    it('should call setUpdate with the provided payload.', async function() {
      const payload = { name: 'Foo', description: null, photoURL: undefined };
      await expect(Organization.findAndSetUpdate(doc.id, payload)).to.eventually.equal('ok');
      sandbox.assert.calledOnce(Organization.findById);
      sandbox.assert.calledWith(Organization.findById, doc.id);
      sandbox.assert.calledOnce(Organization.prototype.setUpdate);
      sandbox.assert.calledWith(Organization.prototype.setUpdate, payload);
    });
  });

  describe('#findAndAssignUpdate', function() {
    beforeEach(async function() {
      sandbox.spy(Organization, 'findById');
      sandbox.stub(Organization.prototype, 'assignUpdate').resolves('ok');
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should reject when no document could be found for the provided id.', async function() {
      const id = '5b1557bdb4889f01684ad517';
      await expect(Organization.findAndAssignUpdate(id)).to.be.rejectedWith(Error, `Unable to update organization: no record was found for ID '${id}'`)
    });
    it('should reject when the id is not provided.', async function() {
      await expect(Organization.findAndAssignUpdate()).to.be.rejectedWith(Error, `Unable to update organization: no record was found for ID 'undefined'`)
    });
    it('should call assignUpdate with the provided payload.', async function() {
      const payload = { name: 'Foo', description: null, photoURL: undefined };
      await expect(Organization.findAndAssignUpdate(doc.id, payload)).to.eventually.equal('ok');
      sandbox.assert.calledOnce(Organization.findById);
      sandbox.assert.calledWith(Organization.findById, doc.id);
      sandbox.assert.calledOnce(Organization.prototype.assignUpdate);
      sandbox.assert.calledWith(Organization.prototype.assignUpdate, payload);
    });
  });

  describe('#setUpdate', function() {
    beforeEach(async function() {
      sandbox.spy(Organization.prototype, 'set');
      sandbox.stub(Organization.prototype, 'save').resolves('ok');
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('set the payload as-is and save the document', async function() {
      const payload = { name: 'Foo', description: null, photoURL: undefined };
      await expect(doc.setUpdate(payload)).to.eventually.equal('ok');
      sandbox.assert.calledWith(Organization.prototype.set, payload);
      sandbox.assert.calledOnce(Organization.prototype.save);
    });
  });

  describe('#assignUpdate', function() {
    beforeEach(async function() {
      sandbox.spy(Organization.prototype, 'set');
      sandbox.stub(Organization.prototype, 'save').resolves('ok');
    });
    afterEach(async function() {
      sandbox.restore();
    });

    it('should properly set the payload.', async function() {
      const payload = { name: 'Foo', description: null, photoURL: undefined };
      await expect(doc.assignUpdate(payload)).to.eventually.equal('ok');
      // Three payload keys, but one is undefined, so it should only call set twice.
      sandbox.assert.calledTwice(Organization.prototype.set);
      // Set the passed value
      expect(doc.name).to.equal('Foo');
      // Convert null to undefined
      expect(doc.description).to.be.undefined;
      // Leave as-is
      expect(doc.photoURL).to.not.be.undefined;
      sandbox.assert.calledOnce(Organization.prototype.save);
    });
  });
});
