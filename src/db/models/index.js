const definitions = require("../schema/definitions");
const { createModel } = require("../modelFactory");

const models = {};

for (const [name, definition] of Object.entries(definitions)) {
  models[name] = createModel(name, definition);
}

module.exports = models;