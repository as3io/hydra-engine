module.exports = {
  get(name, required = false) {
    const value = process.env[name];
    if (!required) return value;
    if (value === null || value === undefined || value === '') {
      throw new Error(`The required environment variable '${name}' was not set.`);
    }
    return value;
  },
};
