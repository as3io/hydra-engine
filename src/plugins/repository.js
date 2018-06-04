module.exports = function repositoryPlugin(schema) {
  // eslint-disable-next-line no-param-reassign
  schema.statics.findAndSetUpdate = async function findAndSetUpdate(id, payload) {
    const doc = await this.findById(id);
    if (!doc) throw new Error(`Unable to update ${this.constructor.modelName}: no record was found for ID '${id}'`);
    doc.set(payload);
    return doc.save();
  };

  // eslint-disable-next-line no-param-reassign
  schema.statics.findAndAssignUpdate = async function findAndAssignUpdate(id, payload) {
    const doc = await this.findById(id);
    if (!doc) throw new Error(`Unable to update ${this.constructor.modelName}: no record was found for ID '${id}'`);
    Object.keys(payload).forEach((key) => {
      const value = payload[key];
      if (typeof value !== 'undefined') {
        doc.set(key, value === null ? undefined : value);
      }
    });
    return doc.save();
  };
};
