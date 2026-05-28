const { assertDb } = require('../src/db/runtime');
const definitions = require('../src/db/schema/definitions');

const MODEL_NAMES = Object.keys(definitions);
const TABLE_TO_MODEL = new Map(MODEL_NAMES.map((modelName) => [definitions[modelName].table, modelName]));

function inferDbName(_uri, fallback = 'techmnhub-db') {
  return fallback;
}

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function resolveCollectionName(name) {
  const rawName = String(name || '').trim();
  if (!rawName) {
    return '';
  }

  if (definitions[rawName]) {
    return definitions[rawName].table;
  }

  return rawName;
}

function resolveDisplayName(name) {
  const rawName = String(name || '').trim();
  if (!rawName) {
    return '';
  }

  return TABLE_TO_MODEL.get(rawName) || rawName;
}

async function getAvailableTables(db) {
  const rows = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  return (rows.results || []).map((row) => row.name).filter(Boolean);
}

async function exportTable(db, tableName) {
  const totalRow = await db.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`).first();
  const rows = await db.prepare(
    `SELECT id, data, created_at AS createdAt, updated_at AS updatedAt FROM ${quoteIdentifier(tableName)} ORDER BY created_at DESC`,
  ).all();

  const documents = (rows.results || []).map((row) => {
    const payload = row.data ? JSON.parse(row.data) : {};
    return {
      id: row.id,
      ...payload,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });

  return {
    name: resolveDisplayName(tableName),
    tableName,
    documents: Number(totalRow?.count || 0),
    records: documents,
  };
}

async function exportDatabaseData({ selectedCollections } = {}) {
  const db = assertDb();
  const availableTables = await getAvailableTables(db);
  const requestedCollections = Array.isArray(selectedCollections)
    ? selectedCollections.map((name) => String(name || '').trim()).filter(Boolean)
    : [];

  const collectionNames = requestedCollections.length > 0
    ? requestedCollections
        .map(resolveCollectionName)
        .filter((tableName) => availableTables.includes(tableName))
    : availableTables;

  if (requestedCollections.length > 0 && collectionNames.length === 0) {
    throw new Error('None of the requested collections were found in the D1 database.');
  }

  const summaries = [];
  const data = {};

  for (const tableName of collectionNames) {
    const snapshot = await exportTable(db, tableName);
    summaries.push({ collectionName: snapshot.name, documents: snapshot.documents });
    data[snapshot.name] = snapshot.records;
  }

  return {
    sourceDbName: 'techmnhub-db',
    exportedAt: new Date().toISOString(),
    collections: summaries,
    data,
  };
}

async function cloneDatabase(options = {}) {
  const exportResult = await exportDatabaseData(options);
  return {
    sourceDbName: exportResult.sourceDbName,
    destinationDbName: 'techmnhub-db',
    collections: exportResult.collections,
    data: exportResult.data,
  };
}

async function cloneDatabaseBetweenUris(options = {}) {
  const exportResult = await exportDatabaseData(options);
  return {
    sourceDbName: exportResult.sourceDbName,
    destinationDbName: 'techmnhub-db',
    collections: exportResult.collections,
    data: exportResult.data,
  };
}

module.exports = {
  cloneDatabase,
  cloneDatabaseBetweenUris,
  exportDatabaseData,
  inferDbName,
};
