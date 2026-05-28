const getDb = () => globalThis.__D1_DB || null;

const setDb = (db) => {
  globalThis.__D1_DB = db || null;
};

const assertDb = () => {
  const db = getDb();
  if (!db) {
    throw new Error("Cloudflare D1 binding DB is not available");
  }
  return db;
};

module.exports = {
  getDb,
  setDb,
  assertDb,
};