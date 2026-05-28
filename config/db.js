const { assertDb } = require("../src/db/runtime");

const connectDB = async () => {
  assertDb();
  console.log("D1 binding available");
};

module.exports = connectDB;
