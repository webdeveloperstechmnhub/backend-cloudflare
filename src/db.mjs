import { ensureDbSchema } from "./db/bootstrap.mjs";

export const ensureMongoConnected = async () => {
  await ensureDbSchema();
};