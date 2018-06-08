module.exports = {
  async testTrimmedField(document, field, { value = ' Trim Me ', expected = 'Trim Me' } = {}) {
    document.set(field, value);
    await expect(document.save()).to.be.fulfilled;
    expect(document.get(field)).to.equal(expected);
  },

  async testUniqueField(doc1, doc2, field, value = 'Unique Name') {
    doc1.set(field, value);
    await expect(doc1.save()).to.be.fulfilled;
    doc2.set(field, value);
    await expect(doc2.save()).to.be.rejectedWith(Error, /E11000 duplicate key error/);
  },

  async testRequiredField(document, field, value) {
    document.set(field, value);
    await expect(document.save()).to.be.rejectedWith(Error, /is required/i);
  },

  async testRefOne(document, field, value, expected) {
    document.set(field, value);
    await expect(document.save()).to.be.rejectedWith(Error, expected);
  },
}
