import { assertDb } from "./runtime.js";
import definitions from "./schema/definitions.js";

let schemaReadyPromise = null;

const buildCreateTableSql = () => {
  const statements = Object.values(definitions).map((definition) => {
    return `CREATE TABLE IF NOT EXISTS ${definition.table} (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`;
  });

  return statements.join(";\n") + ";";
};

export const ensureDbSchema = async () => {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      const db = assertDb();
      await db.exec(buildCreateTableSql());
      return db;
    })();
  }

  return schemaReadyPromise;
};