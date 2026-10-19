// Runtime state for AI Countdown: repository analyses, contributor profiles,
// the metric series, source caches, the Slop Score crawl, and locks.
//
// With Mongo (production) all of it lives in the database and nothing is
// written to data/. Without Mongo (a standalone local run, or
// AI_COUNTDOWN_MONGO=false) the same calls fall back to JSON files in data/.
//
// Reference data that is committed to git (sources, agents, Work and Life
// ratings) is read from data/ directly and is not handled here.

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

let mongoose = null;
try {
  mongoose = require('mongoose');
} catch (error) {
  // The local standalone server can run without host-specific dependencies.
}

const STATE_COLLECTION = 'ai_countdown_state';
const LOCKS_COLLECTION = 'ai_countdown_locks';

function createStorage({ dataDir, mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:3382/TDLib', label = 'AI Countdown' }) {
  const mongoDisabled = process.env.AI_COUNTDOWN_MONGO === 'false' || !mongoose;
  const fileQueues = new Map();
  const collectionPromises = new Map();
  let connectionPromise = null;

  // ------------------------------------------------------------------ files

  async function readJsonFile(filePath, fallback) {
    try {
      return JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') console.warn(`Could not read ${path.basename(filePath)}:`, error.message);
      return fallback;
    }
  }

  // Writes to one file run one after another, and every write uses its own
  // temporary name, so two writers never rename the same .tmp file.
  function withFileQueue(filePath, task) {
    const previous = fileQueues.get(filePath) || Promise.resolve();
    const next = previous.catch(() => {}).then(task);
    fileQueues.set(filePath, next);
    next.finally(() => {
      if (fileQueues.get(filePath) === next) fileQueues.delete(filePath);
    }).catch(() => {});
    return next;
  }

  async function writeJsonFileNow(filePath, value) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporaryFile = `${filePath}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;
    try {
      await fs.writeFile(temporaryFile, JSON.stringify(value, null, 2), 'utf8');
      await fs.rename(temporaryFile, filePath);
    } catch (error) {
      await fs.rm(temporaryFile, { force: true }).catch(() => {});
      throw error;
    }
  }

  function writeJsonFile(filePath, value) {
    return withFileQueue(filePath, () => writeJsonFileNow(filePath, value));
  }

  // Read, change, and write one file as a single queued step.
  function updateJsonFile(filePath, fallback, mutate) {
    return withFileQueue(filePath, async () => {
      const current = await readJsonFile(filePath, fallback);
      const next = await mutate(current);
      await writeJsonFileNow(filePath, next ?? current);
      return next ?? current;
    });
  }

  // ------------------------------------------------------------------ mongo

  async function connection() {
    if (mongoDisabled) return null;
    if (!connectionPromise) {
      connectionPromise = (async () => {
        try {
          const connected = await mongoose.createConnection(mongoUri, { serverSelectionTimeoutMS: 3000, connectTimeoutMS: 3000 }).asPromise();
          console.log(`${label}: Mongo persistence enabled (${connected.name})`);
          return connected;
        } catch (error) {
          console.warn(`${label}: Mongo unavailable, using JSON files in data/: ${error.message}`);
          return null;
        }
      })();
    }
    return connectionPromise;
  }

  async function collection(name, indexDefinition) {
    if (mongoDisabled) return null;
    if (!collectionPromises.has(name)) {
      collectionPromises.set(name, (async () => {
        const connected = await connection();
        if (!connected) return null;
        const created = connected.db.collection(name);
        if (indexDefinition) await created.createIndex(indexDefinition, { unique: true });
        return created;
      })());
    }
    return collectionPromises.get(name);
  }

  async function usesMongo() {
    return Boolean(await connection());
  }

  async function close() {
    const connected = connectionPromise ? await connectionPromise : null;
    if (connected) await connected.close();
  }

  // ------------------------------------------------------- single documents

  // A named document: { key, value, updatedAt } in ai_countdown_state, or a JSON
  // file. A document that is missing in Mongo is imported once from its legacy file.
  function createDocument(key, legacyFile) {
    let imported = false;
    return {
      async read(fallback = null) {
        const states = await collection(STATE_COLLECTION, { key: 1 });
        if (!states) return readJsonFile(legacyFile, fallback);
        try {
          const document = await states.findOne({ key }, { projection: { _id: 0, value: 1 } });
          if (document) return document.value;
          if (!imported && legacyFile) {
            imported = true;
            const legacy = await readJsonFile(legacyFile, null);
            if (legacy !== null) {
              await states.updateOne({ key }, { $setOnInsert: { key, value: legacy, updatedAt: new Date() } }, { upsert: true });
              return legacy;
            }
          }
        } catch (error) {
          console.warn(`Could not read ${key} from Mongo: ${error.message}`);
        }
        return fallback;
      },
      // Writes of one document keep their call order within the process.
      write(value) {
        return withFileQueue(`state:${key}`, async () => {
          const states = await collection(STATE_COLLECTION, { key: 1 });
          if (!states) return writeJsonFileNow(legacyFile, value);
          imported = true;
          await states.updateOne({ key }, { $set: { key, value, updatedAt: new Date() } }, { upsert: true });
        });
      }
    };
  }

  // ----------------------------------------------------------- record sets

  // Records keyed by id. Mongo stores one document per record, so writing one
  // record never rewrites the others. Without Mongo the set is one JSON file
  // { version, [fileField]: { id: record } }.
  //
  // collectionName  Mongo collection
  // idField         field that holds the id in Mongo documents
  // valueField      field that holds the record; null spreads the record into the document
  // legacyFile      JSON file used without Mongo and imported once into an empty collection
  // fileField       map field inside the JSON file
  // legacyEntries   reads [id, record] pairs from an older file layout
  function createRecordSet({
    collectionName,
    idField,
    valueField = null,
    legacyFile,
    fileField,
    toId = (id) => id,
    legacyEntries = (file) => Object.entries(file?.[fileField] || {})
  }) {
    let importPromise = null;
    const toDocument = (id, record) => (valueField
      ? { [idField]: id, [valueField]: record, updatedAt: new Date() }
      : { ...record, [idField]: id, updatedAt: new Date() });
    // Documents written before valueField existed keep the record spread at the top level.
    const fromDocument = (document) => {
      if (valueField && document[valueField] !== undefined) return document[valueField];
      const { _id, updatedAt, ...record } = document;
      return record;
    };
    const emptyFile = () => ({ version: 1, [fileField]: {} });
    const fileMap = (file) => (file?.[fileField] && !Array.isArray(file[fileField])
      ? file[fileField]
      : Object.fromEntries(legacyEntries(file || {}).map(([id, record]) => [toId(id), record])));
    const readFileMap = async () => fileMap(await readJsonFile(legacyFile, emptyFile()));
    const updateFileMap = (change) => updateJsonFile(legacyFile, emptyFile(), (file) => {
      const map = fileMap(file);
      change(map);
      return { version: 1, [fileField]: map };
    });

    async function mongoCollection() {
      const records = await collection(collectionName, { [idField]: 1 });
      if (!records) return null;
      if (!importPromise) {
        importPromise = (async () => {
          try {
            if (await records.estimatedDocumentCount()) return;
            const legacy = await readJsonFile(legacyFile, null);
            const entries = legacy ? Object.entries(fileMap(legacy)) : [];
            if (!entries.length) return;
            await records.bulkWrite(entries.map(([id, record]) => ({
              updateOne: { filter: { [idField]: toId(id) }, update: { $setOnInsert: toDocument(toId(id), record) }, upsert: true }
            })), { ordered: false });
            console.log(`${label}: imported ${entries.length} records from ${path.basename(legacyFile)} into ${collectionName}`);
          } catch (error) {
            console.warn(`Could not import ${path.basename(legacyFile)} into ${collectionName}: ${error.message}`);
          }
        })();
      }
      await importPromise;
      return records;
    }

    return {
      async get(id) {
        const key = toId(id);
        const records = await mongoCollection();
        if (!records) return (await readFileMap())[key] ?? null;
        const document = await records.findOne({ [idField]: key });
        return document ? fromDocument(document) : null;
      },
      // projection applies to Mongo only; the file fallback always returns whole records.
      async list(query = {}, { sort = null, limit = 0, projection = null } = {}) {
        const records = await mongoCollection();
        if (!records) return readFileMap();
        let cursor = records.find(query, projection ? { projection: { ...projection, [idField]: 1 } } : {});
        if (sort) cursor = cursor.sort(sort);
        if (limit) cursor = cursor.limit(limit);
        const documents = await cursor.toArray();
        return Object.fromEntries(documents.filter((document) => document[idField] !== undefined).map((document) => [document[idField], fromDocument(document)]));
      },
      async put(id, record) {
        const key = toId(id);
        const records = await mongoCollection();
        if (!records) {
          await updateFileMap((map) => { map[key] = record; });
          return;
        }
        const document = toDocument(key, record);
        await records.replaceOne({ [idField]: key }, document, { upsert: true });
      },
      async putMany(entries) {
        const list = Array.from(entries || []).map(([id, record]) => [toId(id), record]);
        if (!list.length) return;
        const records = await mongoCollection();
        if (!records) {
          await updateFileMap((map) => { for (const [key, record] of list) map[key] = record; });
          return;
        }
        await records.bulkWrite(list.map(([key, record]) => ({
          replaceOne: { filter: { [idField]: key }, replacement: toDocument(key, record), upsert: true }
        })), { ordered: false });
      },
      async delete(id) {
        const key = toId(id);
        const records = await mongoCollection();
        if (!records) {
          await updateFileMap((map) => { delete map[key]; });
          return;
        }
        await records.deleteOne({ [idField]: key });
      },
      async trim(keepLatest, sortField) {
        const records = await mongoCollection();
        if (!records) {
          await updateFileMap((map) => {
            const keys = Object.keys(map).sort((left, right) => String(map[right]?.[sortField] ?? right).localeCompare(String(map[left]?.[sortField] ?? left)));
            for (const key of keys.slice(keepLatest)) delete map[key];
          });
          return;
        }
        const extra = await records.find({}, { projection: { _id: 1 } }).sort({ [sortField]: -1 }).skip(keepLatest).toArray();
        if (extra.length) await records.deleteMany({ _id: { $in: extra.map((document) => document._id) } });
      }
    };
  }

  // ------------------------------------------------------------------ locks

  // Cross-process locks: a document per lock in ai_countdown_locks, or a file
  // per lock in lockDir. A lock whose updatedAt is older than staleMs can be taken over.
  function createLocks({ lockDir, staleMs }) {
    const owner = `${process.pid}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const lockPath = (name) => path.join(lockDir, `${Buffer.from(name, 'utf8').toString('base64url')}.lock`);

    async function read(name) {
      const locks = await collection(LOCKS_COLLECTION, { name: 1 });
      if (locks) {
        const document = await locks.findOne({ name }, { projection: { _id: 0 } });
        return document ? { ...document, startedAt: document.startedAt?.toISOString?.() || document.startedAt, updatedAt: document.updatedAt?.toISOString?.() || document.updatedAt } : null;
      }
      try {
        return JSON.parse(await fs.readFile(lockPath(name), 'utf8'));
      } catch (error) {
        if (error.code === 'ENOENT') return null;
        try {
          const stat = await fs.stat(lockPath(name));
          return { name, updatedAt: new Date(stat.mtimeMs).toISOString(), invalid: true };
        } catch (statError) {
          return null;
        }
      }
    }

    async function acquire(name, stage) {
      const now = new Date();
      const lock = { name, owner, stage, startedAt: now, updatedAt: now };
      const locks = await collection(LOCKS_COLLECTION, { name: 1 });
      if (locks) {
        try {
          await locks.insertOne({ ...lock });
          return { ...lock, mongo: true };
        } catch (error) {
          if (error.code !== 11000) throw error;
        }
        const takeover = await locks.findOneAndUpdate(
          { name, updatedAt: { $lt: new Date(Date.now() - staleMs) } },
          { $set: lock },
          { returnDocument: 'after' }
        );
        const taken = takeover?.value !== undefined ? takeover.value : takeover;
        return taken ? { ...lock, mongo: true } : null;
      }

      await fs.mkdir(lockDir, { recursive: true });
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const handle = await fs.open(lockPath(name), 'wx');
          await handle.writeFile(JSON.stringify({ ...lock, startedAt: now.toISOString(), updatedAt: now.toISOString() }), 'utf8');
          await handle.close();
          return { ...lock, path: lockPath(name) };
        } catch (error) {
          if (error.code !== 'EEXIST') throw error;
          const existing = await read(name);
          const updatedAt = Date.parse(existing?.updatedAt || '');
          if (Number.isFinite(updatedAt) && Date.now() - updatedAt < staleMs) return null;
          await fs.unlink(lockPath(name)).catch(() => {});
        }
      }
      return null;
    }

    async function refresh(lock, stage = lock?.stage) {
      if (!lock) return true;
      const locks = lock.mongo ? await collection(LOCKS_COLLECTION, { name: 1 }) : null;
      if (locks) {
        const result = await locks.updateOne({ name: lock.name, owner: lock.owner }, { $set: { stage, updatedAt: new Date() } });
        return result.matchedCount === 1;
      }
      if (!lock.path) return true;
      const current = await read(lock.name);
      if (!current || current.owner !== lock.owner) return false;
      try {
        await fs.writeFile(lock.path, JSON.stringify({ ...current, stage, updatedAt: new Date().toISOString() }), 'utf8');
        return true;
      } catch (error) {
        return false;
      }
    }

    async function release(lock) {
      if (!lock) return;
      const locks = lock.mongo ? await collection(LOCKS_COLLECTION, { name: 1 }) : null;
      if (locks) {
        await locks.deleteOne({ name: lock.name, owner: lock.owner });
        return;
      }
      if (!lock.path) return;
      const current = await read(lock.name);
      if (current && current.owner !== lock.owner) return;
      await fs.unlink(lock.path).catch((error) => {
        if (error.code !== 'ENOENT') console.warn(`Could not release lock ${lock.name}: ${error.message}`);
      });
    }

    return { owner, read, acquire, refresh, release };
  }

  return {
    dataDir,
    readJsonFile,
    writeJsonFile,
    updateJsonFile,
    collection,
    usesMongo,
    close,
    createDocument,
    createRecordSet,
    createLocks
  };
}

// State shared by server.js and the refresh-code-index.js worker.
function createCodeIndexStores(storage) {
  const dataDir = storage.dataDir;
  return {
    slopscore: storage.createRecordSet({
      collectionName: 'ai_countdown_slopscore',
      idField: 'key',
      valueField: 'entry',
      legacyFile: path.join(dataDir, 'slopscore-cache.json'),
      fileField: 'entries'
    }),
    codeIndex: storage.createDocument('code-index', path.join(dataDir, 'code-index-cache.json')),
    progress: storage.createDocument('code-index-progress', path.join(dataDir, 'code-index-progress.json')),
    catalog: storage.createDocument('code-index-catalog', path.join(dataDir, 'code-index-catalog.json')),
    workerLocks: storage.createLocks({ lockDir: path.join(dataDir, 'locks'), staleMs: 30 * 60 * 1000 })
  };
}

module.exports = { createStorage, createCodeIndexStores };
