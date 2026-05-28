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

async function inspectCollections(db) {
  const tables = await getAvailableTables(db);
  const details = [];

  for (const tableName of tables) {
    const countRow = await db.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`).first();
    details.push({
      name: TABLE_TO_MODEL.get(tableName) || tableName,
      tableName,
      documentCount: Number(countRow?.count || 0),
    });
  }

  return details;
}

async function listDatabaseOverview(_sourceUri) {
  const db = assertDb();
  const collections = await inspectCollections(db);

  return {
    totalDatabases: 1,
    systemDatabases: [],
    databases: [
      {
        name: 'techmnhub-db',
        sizeOnDisk: 0,
        empty: collections.length === 0,
        isSystemDatabase: false,
        collections,
      },
    ],
    allDatabases: [
      {
        name: 'techmnhub-db',
        sizeOnDisk: 0,
        empty: collections.length === 0,
        isSystemDatabase: false,
        collections,
      },
    ],
  };
}

async function getCollectionPreview(_sourceUri, _dbName, collectionName, limit = 10) {
  const db = assertDb();
  const resolvedCollectionName = resolveCollectionName(collectionName);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

  if (!resolvedCollectionName) {
    throw new Error('Collection name is required.');
  }

  const totalRow = await db.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(resolvedCollectionName)}`).first();
  const documentsResult = await db.prepare(
    `SELECT id, data, created_at AS createdAt, updated_at AS updatedAt FROM ${quoteIdentifier(resolvedCollectionName)} ORDER BY created_at DESC LIMIT ?`,
  ).bind(safeLimit).all();

  const documents = (documentsResult.results || []).map((row) => {
    const payload = row.data ? JSON.parse(row.data) : {};
    return {
      id: row.id,
      ...payload,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });

  return {
    databaseName: 'techmnhub-db',
    collectionName: resolveDisplayName(resolvedCollectionName),
    tableName: resolvedCollectionName,
    totalDocuments: Number(totalRow?.count || 0),
    returnedDocuments: documents.length,
    limit: safeLimit,
    documents,
  };
}

module.exports = {
  inferDbName,
  listDatabaseOverview,
  getCollectionPreview,
};
