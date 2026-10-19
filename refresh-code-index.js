const path = require('node:path');
const { createStorage, createCodeIndexStores } = require('./storage');

const ROOT = __dirname;
const CACHE_DIR = path.join(ROOT, 'data');
// The crawl state (Slop Score records, catalog, progress, worker lock) lives in
// Mongo next to the server's state; data/ files are only a local fallback.
const storage = createStorage({ dataDir: CACHE_DIR, label: 'Code-index worker' });
const stores = createCodeIndexStores(storage);
const WORKER_LOCK_NAME = 'code-index-worker';
const CATALOG_URL = 'https://slopscore.ava.pet/';
const REQUEST_TIMEOUT_MS = 12_000;
const RECORD_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const FETCH_CONCURRENCY = 8;
const CHECKPOINT_BATCH_SIZE = 64;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cacheKey(repo, branch) {
  return `${repo}#${branch}`;
}

async function readCache() {
  return { version: 1, entries: await stores.slopscore.list() };
}

function createSlopPayload(raw, repo, branch) {
  const record = raw.record || raw;
  const scoreValue = Number(raw.score?.value ?? record.score?.value ?? raw.value);
  if (!Number.isFinite(scoreValue)) throw new Error('Slop Score response has no numeric score');

  const evidence = record.evidence || raw.evidence || {};
  const signalCount = (value) => Array.isArray(value) ? value.length : Number(value ?? 0) || 0;
  const commitSignals = signalCount(evidence.commit_signals);
  const sourceSignals = signalCount(evidence.source_signals);
  const ignoreSignals = signalCount(evidence.ignore_signals);

  return {
    status: 'live',
    repo,
    branch,
    score: clamp(scoreValue, 0, 100),
    codeIndex: clamp(Math.round(100 - scoreValue), 0, 100),
    evidenceCount: commitSignals + sourceSignals + ignoreSignals,
    commitSignals,
    sourceSignals,
    ignoreSignals,
    density: record.density ?? raw.density ?? null,
    fetchedAt: new Date().toISOString()
  };
}

async function fetchText(url, accept = 'text/html') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { accept, 'user-agent': 'AI-Countdown-code-index-worker/0.2' },
      signal: controller.signal
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.slice(0, 160)}`);
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSlopScore(repo, branch) {
  const endpoint = branch
    ? `https://slopscore.ava.pet/repo/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}`
    : `https://slopscore.ava.pet/repo/${encodeURIComponent(repo)}`;
  return createSlopPayload(JSON.parse(await fetchText(endpoint, 'application/json')), repo, branch);
}

function parseRepositoryCatalog(html) {
  const totalMatch = html.match(/all scanned repos\s*\(([\d,\s]+)\)/i);
  const catalogTotal = totalMatch ? Number(totalMatch[1].replace(/[,\s]/g, '')) : null;
  const entries = [];
  const seen = new Set();
  const linkPattern = /href=["']\/repo\/([^"'?#]+)["']/gi;
  let match;

  while ((match = linkPattern.exec(html))) {
    try {
      const encodedPath = match[1];
      const separator = encodedPath.lastIndexOf('/');
      const repoPart = separator > 0 ? encodedPath.slice(0, separator) : encodedPath;
      const branchPart = separator > 0 ? encodedPath.slice(separator + 1) : '';
      const repo = decodeURIComponent(repoPart);
      const branch = branchPart ? decodeURIComponent(branchPart) : '';
      if (!/^https?:\/\//i.test(repo)) continue;
      const key = cacheKey(repo, branch);
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({ repo, branch });
    } catch {
      // Ignore malformed catalog links and continue the batch.
    }
  }

  return { catalogTotal, entries };
}

function isFresh(record, now) {
  const fetchedAt = Date.parse(record?.fetchedAt || '');
  return Number.isFinite(Number(record?.codeIndex))
    && Number.isFinite(fetchedAt)
    && now - fetchedAt < RECORD_CACHE_TTL_MS;
}

function quantile(sortedValues, fraction) {
  if (!sortedValues.length) return null;
  const position = (sortedValues.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] + ((sortedValues[upper] - sortedValues[lower]) * (position - lower));
}

function summarize(entries, cache) {
  const values = entries
    .map(({ repo, branch }) => Number(cache.entries[cacheKey(repo, branch)]?.codeIndex))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const mean = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
  return {
    median: quantile(values, .5),
    mean,
    p25: quantile(values, .25),
    p75: quantile(values, .75),
    included: values.length
  };
}

function round(value) {
  return value === null ? null : Math.round(value * 10) / 10;
}

// The lock is refreshed after every batch; a worker that died leaves a lock that
// goes stale after 30 minutes and is then taken over.
let workerLock = null;

async function acquireLock() {
  workerLock = await stores.workerLocks.acquire(WORKER_LOCK_NAME, 'running');
  return Boolean(workerLock);
}

async function refreshLock() {
  if (workerLock && !(await stores.workerLocks.refresh(workerLock))) throw new Error('The code-index worker lock was taken over by another worker');
}

async function releaseLock() {
  if (workerLock) await stores.workerLocks.release(workerLock);
  workerLock = null;
}

async function writeProgress(progress) {
  await stores.progress.write({
    ...progress,
    updatedAt: new Date().toISOString()
  });
}

async function mapBatch(entries, worker) {
  const results = new Array(entries.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(FETCH_CONCURRENCY, entries.length) }, async () => {
    while (cursor < entries.length) {
      const index = cursor++;
      results[index] = await worker(entries[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

async function processEntry(entry, cache, now) {
  const key = cacheKey(entry.repo, entry.branch);
  const existing = cache.entries[key];
  if (isFresh(existing, now)) return { record: existing, action: 'reused' };

  try {
    return { record: await fetchSlopScore(entry.repo, entry.branch), action: 'fresh' };
  } catch (error) {
    if (Number.isFinite(Number(existing?.codeIndex))) {
      return {
        record: { ...existing, status: 'stale-cache', cachedAt: existing.fetchedAt, error: error.message },
        action: 'stale'
      };
    }
    return { record: null, action: 'failed', error: error.message };
  }
}

async function createNewRun(force) {
  const previous = await stores.progress.read(null);
  const previousCatalog = await stores.catalog.read(null);
  if (!force && previousCatalog?.entries?.length && previous?.status !== 'complete') {
    return {
      catalog: previousCatalog,
      progress: { ...previous, status: 'running', resumedAt: new Date().toISOString(), error: null }
    };
  }

  console.log('Fetching the current Slop Score repository catalog…');
  const catalog = parseRepositoryCatalog(await fetchText(CATALOG_URL));
  if (!catalog.entries.length) throw new Error('The public repository catalog returned no repository links');
  await stores.catalog.write({
    version: 1,
    source: CATALOG_URL,
    fetchedAt: new Date().toISOString(),
    catalogTotal: catalog.catalogTotal,
    entries: catalog.entries
  });

  return {
    catalog,
    progress: {
      version: 1,
      runId: new Date().toISOString().replace(/[:.]/g, '-'),
      status: 'running',
      startedAt: new Date().toISOString(),
      nextIndex: 0,
      processed: 0,
      fresh: 0,
      reused: 0,
      stale: 0,
      failed: 0,
      catalogTotal: catalog.catalogTotal,
      catalogEntries: catalog.entries.length,
      source: CATALOG_URL
    }
  };
}

async function run() {
  const force = process.argv.includes('--force');
  if (!await acquireLock()) {
    console.log('A code-index worker is already running. Nothing to do.');
    return;
  }

  try {
    const { catalog, progress } = await createNewRun(force);
    const cache = await readCache();
    const entries = catalog.entries;
    await writeProgress(progress);

    for (let start = Number(progress.nextIndex) || 0; start < entries.length; start += CHECKPOINT_BATCH_SIZE) {
      const batch = entries.slice(start, start + CHECKPOINT_BATCH_SIZE);
      const now = Date.now();
      const results = await mapBatch(batch, (entry) => processEntry(entry, cache, now));

      const changed = [];
      results.forEach(({ record, action }, index) => {
        const entry = batch[index];
        if (!record) return;
        const key = cacheKey(entry.repo, entry.branch);
        cache.entries[key] = record;
        if (action !== 'reused') changed.push([key, record]);
      });

      results.forEach(({ action }) => { progress[action] = (progress[action] || 0) + 1; });
      progress.nextIndex = start + batch.length;
      progress.processed = progress.nextIndex;
      const summary = summarize(entries, cache);
      progress.median = round(summary.median);
      progress.mean = round(summary.mean);
      progress.p25 = round(summary.p25);
      progress.p75 = round(summary.p75);

      // The cache is written before the cursor advances, so a crash can only
      // repeat a small batch and never forces a full catalog restart.
      await stores.slopscore.putMany(changed);
      await writeProgress(progress);
      await refreshLock();
      console.log(`Processed ${progress.processed}/${entries.length}; median ${progress.median ?? '—'}%`);
    }

    const summary = summarize(entries, cache);
    const staleCount = progress.stale || 0;
    const failedCount = progress.failed || 0;
    const snapshot = {
      complete: true,
      status: staleCount || failedCount ? 'stale-cache' : 'live',
      codeIndex: round(summary.median),
      medianCodeIndex: round(summary.median),
      meanCodeIndex: round(summary.mean),
      p25: round(summary.p25),
      p75: round(summary.p75),
      source: CATALOG_URL,
      sourceLabel: 'Slop Score',
      weighting: 'median-repository',
      coverage: {
        catalogTotal: catalog.catalogTotal,
        discovered: entries.length,
        included: summary.included,
        percent: catalog.catalogTotal ? round((summary.included / catalog.catalogTotal) * 100) : null
      },
      catalogFetchedAt: (await stores.catalog.read({})).fetchedAt,
      updatedAt: new Date().toISOString(),
      note: 'Median AI-code participation across scanned repositories. The value describes a typical repository, not a line-weighted share of all code.',
      errors: failedCount
    };
    await stores.codeIndex.write(snapshot);
    await writeProgress({
      ...progress,
      status: 'complete',
      nextIndex: entries.length,
      processed: entries.length,
      median: snapshot.medianCodeIndex,
      mean: snapshot.meanCodeIndex,
      p25: snapshot.p25,
      p75: snapshot.p75,
      completedAt: snapshot.updatedAt
    });
    console.log(`Code index complete: median ${snapshot.codeIndex}% from ${summary.included} repositories.`);
  } catch (error) {
    const previous = await stores.progress.read({});
    await writeProgress({ ...previous, status: 'failed', error: error.message });
    console.error('Code index worker failed:', error);
    process.exitCode = 1;
  } finally {
    await releaseLock().catch((error) => console.error('Could not release the code-index worker lock:', error.message));
    await storage.close().catch(() => {});
  }
}

if (require.main === module) run();
