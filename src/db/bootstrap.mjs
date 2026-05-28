import { assertDb } from "./runtime.js";
import definitions from "./schema/definitions.js";

let schemaReadyPromise = null;

const buildCreateTableStatements = () => Object.values(definitions).map((definition) => `CREATE TABLE IF NOT EXISTS ${definition.table} (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`);

export const ensureDbSchema = async () => {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      const db = assertDb();
      for (const statement of buildCreateTableStatements()) {
        await db.exec(statement);
      }
      return db;
    })();
  }

  return schemaReadyPromise;
};