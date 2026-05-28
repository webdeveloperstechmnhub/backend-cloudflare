const crypto = require("crypto");
const { assertDb } = require("./runtime");

const clone = (value) => JSON.parse(JSON.stringify(value ?? null));

const nowIso = () => new Date().toISOString();

const getPathValue = (value, path) => {
  if (!path) return undefined;
  return String(path).split(".").reduce((current, key) => (current == null ? undefined : current[key]), value);
};

const setPathValue = (value, path, nextValue) => {
  const parts = String(path).split(".");
  let cursor = value;
  while (parts.length > 1) {
    const key = parts.shift();
    if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[parts[0]] = nextValue;
};

const matchesRegex = (candidate, pattern) => {
  if (candidate == null) return false;
  const text = String(candidate);
  if (pattern instanceof RegExp) return pattern.test(text);
  if (typeof pattern === "string") return new RegExp(pattern, "i").test(text);
  return false;
};

const matchesFilter = (doc, filter = {}) => {
  const entries = Object.entries(filter || {});
  for (const [key, expected] of entries) {
    if (key === "$or") {
      if (!Array.isArray(expected) || !expected.some((subFilter) => matchesFilter(doc, subFilter))) return false;
      continue;
    }
    if (key === "$and") {
      if (!Array.isArray(expected) || !expected.every((subFilter) => matchesFilter(doc, subFilter))) return false;
      continue;
    }
    if (key === "$nor") {
      if (Array.isArray(expected) && expected.some((subFilter) => matchesFilter(doc, subFilter))) return false;
      continue;
    }

    const actual = getPathValue(doc, key);

    if (expected && typeof expected === "object" && !(expected instanceof RegExp) && !Array.isArray(expected) && !(expected instanceof Date)) {
      if (Object.prototype.hasOwnProperty.call(expected, "$in") && !expected.$in.includes(actual)) return false;
      if (Object.prototype.hasOwnProperty.call(expected, "$nin") && expected.$nin.includes(actual)) return false;
      if (Object.prototype.hasOwnProperty.call(expected, "$ne") && actual === expected.$ne) return false;
      if (Object.prototype.hasOwnProperty.call(expected, "$exists")) {
        const exists = actual !== undefined && actual !== null;
        if (Boolean(expected.$exists) !== exists) return false;
      }
      if (Object.prototype.hasOwnProperty.call(expected, "$gte") && !(actual >= expected.$gte)) return false;
      if (Object.prototype.hasOwnProperty.call(expected, "$gt") && !(actual > expected.$gt)) return false;
      if (Object.prototype.hasOwnProperty.call(expected, "$lte") && !(actual <= expected.$lte)) return false;
      if (Object.prototype.hasOwnProperty.call(expected, "$lt") && !(actual < expected.$lt)) return false;
      if (Object.prototype.hasOwnProperty.call(expected, "$regex") && !matchesRegex(actual, expected.$regex)) return false;
      continue;
    }

    if (expected instanceof RegExp) {
      if (!matchesRegex(actual, expected)) return false;
      continue;
    }

    if (Array.isArray(expected)) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) return false;
      continue;
    }

    if (actual instanceof Date || expected instanceof Date) {
      if (new Date(actual).getTime() !== new Date(expected).getTime()) return false;
      continue;
    }

    if (actual !== expected) return false;
  }
  return true;
};

const applySort = (rows, sortSpec = {}) => {
  const entries = Object.entries(sortSpec || {});
  if (!entries.length) return rows;
  const [field, direction] = entries[0];
  const dir = Number(direction) < 0 ? -1 : 1;
  return [...rows].sort((left, right) => {
    const a = getPathValue(left, field);
    const b = getPathValue(right, field);
    if (a == null && b == null) return 0;
    if (a == null) return -1 * dir;
    if (b == null) return 1 * dir;
    if (a > b) return 1 * dir;
    if (a < b) return -1 * dir;
    return 0;
  });
};

const projectDoc = (doc, selectSpec) => {
  if (!selectSpec) return doc;
  if (typeof selectSpec === "string") {
    const tokens = selectSpec.split(/\s+/).filter(Boolean);
    const include = tokens.filter((token) => !token.startsWith("-"));
    const exclude = tokens.filter((token) => token.startsWith("-")).map((token) => token.slice(1));
    if (include.length) {
      const projected = { _id: doc._id };
      include.forEach((field) => {
        if (field in doc) projected[field] = doc[field];
      });
      return projected;
    }
    const projected = { ...doc };
    exclude.forEach((field) => delete projected[field]);
    return projected;
  }
  return doc;
};

const createDocument = (model, table, data) => {
  const doc = clone(data);
  doc._id = doc._id || doc.id;
  doc.id = doc.id || doc._id;

  Object.defineProperty(doc, "save", {
    enumerable: false,
    value: async () => model._saveDocument(doc),
  });
  Object.defineProperty(doc, "deleteOne", {
    enumerable: false,
    value: async () => model.deleteOne({ _id: doc._id }),
  });
  Object.defineProperty(doc, "toObject", {
    enumerable: false,
    value: () => clone(doc),
  });
  Object.defineProperty(doc, "toJSON", {
    enumerable: false,
    value: () => clone(doc),
  });
  Object.defineProperty(doc, "populate", {
    enumerable: false,
    value: async (path, select) => model._populateDocs([doc], path, select).then(([item]) => item),
  });
  Object.defineProperty(doc, "$model", {
    enumerable: false,
    value: table,
  });
  return doc;
};

class D1Query {
  constructor(model, filter = {}, single = false) {
    this.model = model;
    this.filter = clone(filter);
    this.single = single;
    this.sortSpec = null;
    this.limitValue = null;
    this.skipValue = 0;
    this.selectSpec = null;
    this.populateSpecs = [];
    this.leanFlag = false;
  }

  sort(value) { this.sortSpec = value; return this; }
  limit(value) { this.limitValue = Number(value); return this; }
  skip(value) { this.skipValue = Number(value); return this; }
  select(value) { this.selectSpec = value; return this; }
  populate(path, select) { this.populateSpecs.push(typeof path === "string" ? { path, select } : path); return this; }
  lean() { this.leanFlag = true; return this; }

  async exec() {
    return this.model._execQuery(this);
  }

  then(resolve, reject) { return this.exec().then(resolve, reject); }
  catch(reject) { return this.exec().catch(reject); }
  finally(handler) { return this.exec().finally(handler); }
}

const applyPopulate = async (model, docs, populateSpecs) => {
  let result = docs;
  for (const spec of populateSpecs) {
    const path = typeof spec === "string" ? spec : spec.path;
    const select = typeof spec === "string" ? undefined : spec.select;
    result = await model._populateDocs(result, path, select);
  }
  return result;
};

const createModel = (name, definition) => {
  const table = definition.table;
  const relations = definition.relations || {};

  const model = {
    modelName: name,
    tableName: table,

    async _fetchAllRows() {
      const db = assertDb();
      const result = await db.prepare(`SELECT id, data, created_at, updated_at FROM ${table}`).all();
      return (result.results || []).map((row) => ({
        ...clone(JSON.parse(row.data)),
        _id: row.id,
        id: row.id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },

    async _saveDocument(doc) {
      const db = assertDb();
      const payload = clone(doc);
      const id = payload._id || payload.id || crypto.randomUUID();
      payload._id = id;
      payload.id = id;
      payload.createdAt = payload.createdAt || nowIso();
      payload.updatedAt = nowIso();
      const data = JSON.stringify(payload);
      const exists = await db.prepare(`SELECT id FROM ${table} WHERE id = ?`).bind(id).first();
      if (exists) {
        await db.prepare(`UPDATE ${table} SET data = ?, updated_at = ? WHERE id = ?`).bind(data, payload.updatedAt, id).run();
      } else {
        await db.prepare(`INSERT INTO ${table} (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)`).bind(id, data, payload.createdAt, payload.updatedAt).run();
      }
      Object.assign(doc, payload);
      return createDocument(model, table, payload);
    },

    async _execQuery(query) {
      let rows = await this._fetchAllRows();
      rows = rows.filter((row) => matchesFilter(row, query.filter));
      rows = applySort(rows, query.sortSpec || { createdAt: -1 });

      if (query.skipValue) rows = rows.slice(query.skipValue);
      if (query.limitValue != null) rows = rows.slice(0, query.limitValue);

      if (query.populateSpecs.length) {
        rows = await applyPopulate(this, rows, query.populateSpecs);
      }

      rows = rows.map((row) => {
        const projected = projectDoc(row, query.selectSpec);
        return query.leanFlag ? projected : createDocument(model, table, projected);
      });

      if (query.single) return rows[0] || null;
      return rows;
    },

    async _populateDocs(docs, path, select) {
      const relation = relations[path];
      if (!relation) return docs;

      const relatedModel = require("./models")[relation.model];
      if (!relatedModel) return docs;

      const values = [...new Set(docs.map((doc) => getPathValue(doc, path)).filter(Boolean))];
      if (!values.length) return docs;

      const relatedDocs = await relatedModel.find({ [relation.foreignKey || "_id"]: { $in: values } }).lean();
      const map = new Map(relatedDocs.map((item) => [String(item._id || item.id), item]));

      return docs.map((doc) => {
        const populated = clone(doc);
        const value = getPathValue(populated, path);
        const nextValue = map.get(String(value)) || null;
        setPathValue(populated, path, select ? projectDoc(nextValue || {}, select) : nextValue);
        return populated;
      });
    },

    find(filter = {}) { return new D1Query(this, filter, false); },
    findOne(filter = {}) { return new D1Query(this, filter, true); },
    findById(id) { return new D1Query(this, { _id: id }, true); },
    countDocuments(filter = {}) { return this.find(filter).lean().then((docs) => docs.length); },
    async create(payload) { const docs = Array.isArray(payload) ? payload : [payload]; const created = []; for (const item of docs) created.push(await this._saveDocument(clone(item))); return Array.isArray(payload) ? created : created[0]; },
    insertMany(payload) { return this.create(payload); },
    async deleteOne(filter = {}) { const docs = await this.find(filter).lean(); const target = docs[0]; if (!target) return { deletedCount: 0 }; const db = assertDb(); await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(target._id).run(); return { deletedCount: 1, deleted: target }; },
    async deleteMany(filter = {}) { const docs = await this.find(filter).lean(); const db = assertDb(); let deletedCount = 0; for (const doc of docs) { await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(doc._id).run(); deletedCount += 1; } return { deletedCount }; },
    async findByIdAndDelete(id) { const doc = await this.findById(id).lean(); if (!doc) return null; await this.deleteOne({ _id: id }); return doc; },
    async updateOne(filter = {}, update = {}, options = {}) { const docs = await this.find(filter).lean(); const target = docs[0]; if (!target) { if (options.upsert) { const created = await this.create({ ...(update.$set || update), ...filter }); return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: created._id }; } return { acknowledged: true, matchedCount: 0, modifiedCount: 0 }; } const merged = { ...target }; if (update.$set) Object.assign(merged, update.$set); if (update.$inc) for (const [key, value] of Object.entries(update.$inc)) merged[key] = Number(merged[key] || 0) + Number(value); if (update.$push) for (const [key, value] of Object.entries(update.$push)) { const current = Array.isArray(merged[key]) ? merged[key] : []; merged[key] = current.concat(value && value.$each ? value.$each : [value]); } await this._saveDocument(merged); return { acknowledged: true, matchedCount: 1, modifiedCount: 1 }; },
    async updateMany(filter = {}, update = {}) { const docs = await this.find(filter).lean(); let modifiedCount = 0; for (const doc of docs) { await this.updateOne({ _id: doc._id }, update); modifiedCount += 1; } return { acknowledged: true, matchedCount: docs.length, modifiedCount }; },
    async findOneAndUpdate(filter = {}, update = {}, options = {}) { const doc = await this.findOne(filter).lean(); if (!doc) { if (options.upsert) return this.create({ ...(update.$set || update), ...filter }); return null; } await this.updateOne({ _id: doc._id }, update); return options.new === false ? doc : this.findById(doc._id).lean(); },
    async findByIdAndUpdate(id, update = {}, options = {}) { return this.findOneAndUpdate({ _id: id }, update, options); },
    async aggregate(pipeline = []) { let rows = await this._fetchAllRows(); for (const stage of pipeline) { if (stage.$match) rows = rows.filter((row) => matchesFilter(row, stage.$match)); else if (stage.$group) { const groups = new Map(); const groupSpec = stage.$group; for (const row of rows) { const groupKey = groupSpec._id == null ? null : getPathValue(row, String(groupSpec._id).replace(/^\$/, "")); const existing = groups.get(JSON.stringify(groupKey)) || { _id: groupKey }; for (const [key, expr] of Object.entries(groupSpec)) { if (key === "_id") continue; if (expr && typeof expr === "object" && expr.$sum != null) { const operand = expr.$sum === 1 ? 1 : Number(getPathValue(row, String(expr.$sum).replace(/^\$/, "")) || 0); existing[key] = Number(existing[key] || 0) + operand; } } groups.set(JSON.stringify(groupKey), existing); } rows = [...groups.values()]; } else if (stage.$sort) rows = applySort(rows, stage.$sort); else if (stage.$limit) rows = rows.slice(0, stage.$limit); else if (stage.$project) rows = rows.map((row) => { const projected = {}; for (const [key, value] of Object.entries(stage.$project)) { if (value === 1) projected[key] = row[key]; else if (typeof value === "string" && value.startsWith("$")) projected[key] = getPathValue(row, value.slice(1)); } return projected; }); }
      return rows;
    },
  };

  return model;
};

module.exports = {
  createModel,
  clone,
  getPathValue,
  matchesFilter,
};