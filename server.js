const http = require('node:http');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

let mongoose = null;
try {
  mongoose = require('mongoose');
} catch (error) {
  // The local standalone server can run without host-specific dependencies.
}

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 8765);
const ROOT = __dirname;
const CACHE_DIR = path.join(ROOT, 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'slopscore-cache.json');
const CODE_INDEX_CACHE_FILE = path.join(CACHE_DIR, 'code-index-cache.json');
const SOURCE_FEEDS_CACHE_FILE = path.join(CACHE_DIR, 'source-feeds-cache.json');
const COMBINED_SNAPSHOT_CACHE_FILE = path.join(CACHE_DIR, 'combined-snapshot-cache.json');
const CODE_INDEX_PROGRESS_FILE = path.join(CACHE_DIR, 'code-index-progress.json');
const CODE_INDEX_WORKER_FILE = path.join(ROOT, 'refresh-code-index.js');
const SOURCES_FILE = path.join(CACHE_DIR, 'sources.json');
const EDITORIAL_OBSERVATIONS_FILE = path.join(CACHE_DIR, 'editorial-observations.json');
const GITHUB_CONTRIBUTORS_FILE = path.join(CACHE_DIR, 'github-contributors.json');
const GITHUB_CONTRIBUTORS_CACHE_FILE = path.join(CACHE_DIR, 'github-contributors-cache.json');
const AI_AGENTS_FILE = path.join(CACHE_DIR, 'ai-agents.json');
const REPOSITORY_ANALYSES_FILE = path.join(CACHE_DIR, 'repository-analyses.json');
const CONTRIBUTOR_PROFILES_FILE = path.join(CACHE_DIR, 'contributor-profiles.json');
const METRIC_SERIES_FILE = path.join(CACHE_DIR, 'metric-series.json');
const WORK_DIR = path.join(CACHE_DIR, 'work');
const WORK_CLASSIFIER_FILE = path.join(WORK_DIR, 'isco08-occupations.json');
const WORK_EMPLOYMENT_FILE = path.join(WORK_DIR, 'employment-ilostat.json');
const WORK_RATINGS_DIR = path.join(WORK_DIR, 'ratings');
const AI_COUNTDOWN_MONGO_COLLECTION = process.env.AI_COUNTDOWN_MONGO_COLLECTION || 'ai_countdown_repository_analyses';
const AI_COUNTDOWN_CONTRIBUTOR_PROFILES_COLLECTION = process.env.AI_COUNTDOWN_CONTRIBUTOR_PROFILES_COLLECTION || 'ai_countdown_contributor_profiles';
const AI_COUNTDOWN_METRIC_SERIES_COLLECTION = process.env.AI_COUNTDOWN_METRIC_SERIES_COLLECTION || 'ai_countdown_metric_series';
const CATALOG_URL = 'https://slopscore.ava.pet/';
const RADAR_API_URL = 'https://oss.korext.com/api/radar/current';
const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const GITHUB_RATE_LIMIT_MESSAGE = 'Лимит запросов к GitHub API исчерпан. Попробуйте позже.';
// Used when a rate-limited response carries neither x-ratelimit-reset nor retry-after.
const GITHUB_RATE_LIMIT_DEFAULT_RETRY_MS = 60 * 1000;
// REST GET /repos/{owner}/{repo}/commits/{sha} returns at most 300 entries in `files`.
const GITHUB_REST_COMMIT_FILES_LIMIT = 300;
const MEO_OCCUPATIONS_URL = 'https://data.meoadvisors.com/datasets/occupations-latest.json';
const DEFAULT_REPO = 'https://github.com/freebsd/freebsd-src';
const DEFAULT_BRANCH = 'main';
const REQUEST_TIMEOUT_MS = 12_000;
const BOTCOMMITS_DATA_URL = 'https://botcommits.dev/data.json';
const OSSINSIGHT_API_URL = 'https://api.ossinsight.io/v1';
const STALE_SOURCE_AFTER_MS = 45 * 24 * 60 * 60 * 1000;
const RECORD_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const GITHUB_CONTRIBUTORS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const GITHUB_SEARCH_MAX_PAGES = 10;
const FETCH_CONCURRENCY = 8;
const REPOSITORY_ANALYSIS_INITIAL_COMMITS = 300;
const REPOSITORY_ANALYSIS_MAX_HISTORY_PAGES = 1000;
const REPOSITORY_ANALYSIS_CONCURRENCY = 4;
const REPOSITORY_ANALYSIS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REPOSITORY_ANALYSIS_HISTORY_LIMIT = 365;
const REPOSITORY_ANALYSIS_CLASSIFICATION_VERSION = 7;
const REPOSITORY_ANALYSIS_AUTHOR_HEURISTIC_MAX_CONTRIBUTORS = 3;
const REPOSITORY_ANALYSIS_AUTHOR_HEURISTIC_MAX_REPOSITORIES = 3;
const REPOSITORY_ANALYSIS_AUTHOR_HEURISTIC_MAX_COMMITS_PER_REPOSITORY = 30;
const REPOSITORY_ANALYSIS_AUTHOR_HEURISTIC_MIN_COMMITS = 3;
const REPOSITORY_ANALYSES_CODE_MIN_COMMITS = 20;
const REPOSITORY_ANALYSES_CODE_CACHE_TTL_MS = 5 * 60 * 1000;
// A small repository should not outrank a much larger one only because its
// AI share is close to 100%. The leaderboard score reaches the raw AI-line
// count once the analyzed history contains this many changed lines.
const REPOSITORY_ANALYSIS_LEADERBOARD_REFERENCE_LINES = 10_000;
const CLEAN_REPOSITORIES_MAX_AI_SHARE = 5;
const CONTRIBUTOR_ANALYSIS_MAX_REPOSITORIES = 5;
const CONTRIBUTOR_ANALYSIS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CLEAN_REPOSITORIES_ACTIVE_DAYS = 90;
let repositoryAnalysesCodeObservationCache = null;
const REPOSITORY_ANALYSIS_AUTHOR_HEURISTIC_CONCURRENCY = 3;
const REPOSITORY_ANALYSIS_AUTHOR_PROFILE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REPOSITORY_ANALYSIS_LOCK_DIR = path.join(CACHE_DIR, 'repository-analysis-locks');
const REPOSITORY_ANALYSIS_LOCK_STALE_MS = 2 * 60 * 60 * 1000;
const REPOSITORY_ANALYSIS_LOCK_OWNER = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const METRIC_SERIES_LIMIT = 3650;
// workBaseline is the prototype Work estimate. It stays one Work source next to
// the occupation ratings from refresh-work-occupations.js.
const DASHBOARD_METRICS = Object.freeze({
  workBaseline: 31,
  life: 24,
  weights: Object.freeze({ code: 0.4, work: 0.35, life: 0.25 })
});
// The occupation median joins the Work median only once most occupations are rated;
// a partial run would otherwise speak for the most common jobs only.
const WORK_OCCUPATIONS_MIN_COVERAGE = 0.9;
let mongoConnectionPromise = null;
const mongoCollectionPromises = new Map();

function loadDotEnv(filePath) {
  try {
    const contents = fsSync.readFileSync(filePath, 'utf8');
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const separator = line.indexOf('=');
      if (separator < 1) continue;
      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && !process.env[key]) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn('Could not load .env:', error.message);
  }
}

loadDotEnv(path.join(ROOT, '.env'));

function getGithubApiToken() {
  return process.env.GITHUB_FFNWZ_API_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim() || '';
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cacheKey(repo, branch) {
  return `${repo}#${branch}`;
}

async function readCache() {
  try {
    return JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn('Could not read Slop Score cache:', error.message);
    return { version: 1, entries: {} };
  }
}

async function writeCache(cache) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const temporaryFile = `${CACHE_FILE}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(cache, null, 2), 'utf8');
  await fs.rename(temporaryFile, CACHE_FILE);
}

async function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn(`Could not read ${path.basename(filePath)}:`, error.message);
    return fallback;
  }
}

async function writeJsonFile(filePath, value) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const temporaryFile = `${filePath}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(temporaryFile, filePath);
}

async function getMongoConnection() {
  if (process.env.AI_COUNTDOWN_MONGO === 'false' || !mongoose) return null;
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = (async () => {
      try {
        const connection = await mongoose.createConnection(
          process.env.MONGO_URI || 'mongodb://127.0.0.1:3382/TDLib',
          { serverSelectionTimeoutMS: 3000, connectTimeoutMS: 3000 }
        ).asPromise();
        console.log('Mongo persistence enabled: TDLib');
        return connection;
      } catch (error) {
        console.warn(`Mongo persistence unavailable; using JSON cache: ${error.message}`);
        return null;
      }
    })();
  }
  return mongoConnectionPromise;
}

async function getMongoCollection(collectionName, indexDefinition) {
  if (process.env.AI_COUNTDOWN_MONGO === 'false' || !mongoose) return null;
  if (!mongoCollectionPromises.has(collectionName)) {
    mongoCollectionPromises.set(collectionName, (async () => {
      const connection = await getMongoConnection();
      if (!connection) return null;
      const collection = connection.db.collection(collectionName);
      await collection.createIndex(indexDefinition, { unique: true });
      console.log(`Mongo collection enabled: ${collectionName}`);
      return collection;
    })());
  }
  return mongoCollectionPromises.get(collectionName);
}

async function getMongoRepositoryCollection() {
  const collectionName = process.env.AI_COUNTDOWN_MONGO_COLLECTION || AI_COUNTDOWN_MONGO_COLLECTION;
  return getMongoCollection(collectionName, { repositoryKey: 1 });
}

async function getMongoContributorProfilesCollection() {
  const collectionName = process.env.AI_COUNTDOWN_CONTRIBUTOR_PROFILES_COLLECTION || AI_COUNTDOWN_CONTRIBUTOR_PROFILES_COLLECTION;
  return getMongoCollection(collectionName, { login: 1 });
}

async function getMongoMetricSeriesCollection() {
  const collectionName = process.env.AI_COUNTDOWN_METRIC_SERIES_COLLECTION || AI_COUNTDOWN_METRIC_SERIES_COLLECTION;
  return getMongoCollection(collectionName, { date: 1 });
}

async function readRepositoryAnalysesCache(fallback = { version: 1, repositories: {} }) {
  const fileCache = await readJsonFile(REPOSITORY_ANALYSES_FILE, fallback);
  const collection = await getMongoRepositoryCollection();
  if (!collection) return fileCache;

  try {
    const documents = await collection.find({}, { projection: { _id: 0, repositoryKey: 1, analysis: 1 } }).toArray();
    if (documents.length) {
      return {
        version: 1,
        repositories: Object.fromEntries(
          documents
            .filter((document) => document.repositoryKey && document.analysis)
            .map((document) => [document.repositoryKey, document.analysis])
        )
      };
    }

    const entries = Object.entries(fileCache.repositories || {});
    if (entries.length) {
      await collection.bulkWrite(entries.map(([repositoryKey, analysis]) => ({
        updateOne: {
          filter: { repositoryKey },
          update: { $set: { repositoryKey, analysis, updatedAt: new Date() } },
          upsert: true
        }
      })), { ordered: false });
    }
  } catch (error) {
    console.warn(`Could not read Mongo repository analyses: ${error.message}`);
  }
  return fileCache;
}

async function writeRepositoryAnalysesCache(cache) {
  repositoryAnalysesCodeObservationCache = null;
  await writeJsonFile(REPOSITORY_ANALYSES_FILE, cache);
  const collection = await getMongoRepositoryCollection();
  if (!collection) return;

  try {
    const entries = Object.entries(cache.repositories || {});
    if (!entries.length) return;
    await collection.bulkWrite(entries.map(([repositoryKey, analysis]) => ({
      updateOne: {
        filter: { repositoryKey },
        update: { $set: { repositoryKey, analysis, updatedAt: new Date() } },
        upsert: true
      }
    })), { ordered: false });
  } catch (error) {
    console.warn(`Could not write Mongo repository analyses: ${error.message}`);
  }
}

async function readContributorProfilesCache(fallback = { version: 1, profiles: {} }) {
  const fileCache = await readJsonFile(CONTRIBUTOR_PROFILES_FILE, fallback);
  const collection = await getMongoContributorProfilesCollection();
  if (!collection) return fileCache;

  try {
    const documents = await collection.find({}, { projection: { _id: 0 } }).toArray();
    if (documents.length) {
      return {
        version: 1,
        profiles: Object.fromEntries(
          documents
            .filter((document) => document.login)
            .map((document) => [String(document.login).toLowerCase(), document])
        )
      };
    }

    const entries = Object.entries(fileCache.profiles || {});
    if (entries.length) {
      await collection.bulkWrite(entries.map(([login, profile]) => ({
        updateOne: {
          filter: { login },
          update: { $set: { login, ...profile, updatedAt: new Date() } },
          upsert: true
        }
      })), { ordered: false });
    }
  } catch (error) {
    console.warn(`Could not read Mongo contributor profiles: ${error.message}`);
  }
  return fileCache;
}

async function writeContributorProfilesCache(cache) {
  await writeJsonFile(CONTRIBUTOR_PROFILES_FILE, cache);
  const collection = await getMongoContributorProfilesCollection();
  if (!collection) return;

  try {
    const entries = Object.entries(cache.profiles || {});
    if (!entries.length) return;
    await collection.bulkWrite(entries.map(([login, profile]) => ({
      updateOne: {
        filter: { login },
        update: { $set: { login, ...profile, updatedAt: new Date() } },
        upsert: true
      }
    })), { ordered: false });
  } catch (error) {
    console.warn(`Could not write Mongo contributor profiles: ${error.message}`);
  }
}

function createDashboardMetricSnapshot(codeValue, status = 'partial', sourceUpdatedAt = null, workValue = DASHBOARD_METRICS.workBaseline) {
  const code = Number(codeValue);
  if (!Number.isFinite(code)) return null;
  const normalizedCode = roundMetric(clamp(code, 0, 100));
  const work = Number.isFinite(Number(workValue)) ? roundMetric(clamp(Number(workValue), 0, 100)) : DASHBOARD_METRICS.workBaseline;
  const overall = roundMetric(
    (normalizedCode * DASHBOARD_METRICS.weights.code)
      + (work * DASHBOARD_METRICS.weights.work)
      + (DASHBOARD_METRICS.life * DASHBOARD_METRICS.weights.life)
  );
  const observedAt = new Date().toISOString();
  return {
    date: dateOnly(observedAt),
    observedAt,
    code: normalizedCode,
    work,
    life: DASHBOARD_METRICS.life,
    overall,
    status,
    sourceUpdatedAt,
    weights: DASHBOARD_METRICS.weights
  };
}

async function readMetricSeriesCache() {
  const fileCache = await readJsonFile(METRIC_SERIES_FILE, { version: 1, points: [] });
  const collection = await getMongoMetricSeriesCollection();
  if (!collection) return fileCache;

  try {
    const documents = await collection.find({}, { projection: { _id: 0 } }).sort({ date: 1 }).toArray();
    if (documents.length) return { version: 1, points: documents };
    const points = Array.isArray(fileCache.points) ? fileCache.points : [];
    if (points.length) {
      await collection.bulkWrite(points.map((point) => ({
        updateOne: {
          filter: { date: point.date },
          update: { $set: { ...point, updatedAt: new Date() } },
          upsert: true
        }
      })), { ordered: false });
    }
  } catch (error) {
    console.warn(`Could not read Mongo metric series: ${error.message}`);
  }
  return fileCache;
}

async function recordMetricSnapshot(point) {
  if (!point) return null;
  const cache = await readMetricSeriesCache();
  const points = Array.isArray(cache.points) ? [...cache.points] : [];
  const existingIndex = points.findIndex((candidate) => candidate.date === point.date);
  if (existingIndex >= 0) points[existingIndex] = point;
  else points.push(point);
  points.sort((left, right) => Date.parse(left.observedAt || left.date) - Date.parse(right.observedAt || right.date));
  cache.version = 1;
  cache.points = points.slice(-METRIC_SERIES_LIMIT);
  await writeJsonFile(METRIC_SERIES_FILE, cache);

  try {
    const collection = await getMongoMetricSeriesCollection();
    if (collection) {
      await collection.updateOne(
        { date: point.date },
        { $set: { ...point, updatedAt: new Date() } },
        { upsert: true }
      );
    }
  } catch (error) {
    console.warn(`Could not write Mongo metric series: ${error.message}`);
  }
  return point;
}

async function getMetricSeries(days = null) {
  const cache = await readMetricSeriesCache();
  const points = Array.isArray(cache.points) ? cache.points : [];
  const requestedDays = Number(days);
  const cutoff = Number.isFinite(requestedDays) && requestedDays > 0
    ? Date.now() - (Math.min(requestedDays, 3650) * 24 * 60 * 60 * 1000)
    : null;
  return {
    version: 1,
    metricKeys: ['code', 'work', 'life', 'overall'],
    updatedAt: points.at(-1)?.observedAt || null,
    points: cutoff === null
      ? points
      : points.filter((point) => Date.parse(point.observedAt || point.date) >= cutoff)
  };
}

function getRepositoryAnalysisLockPath(repositoryKey) {
  const encodedKey = Buffer.from(repositoryKey, 'utf8').toString('base64url');
  return path.join(REPOSITORY_ANALYSIS_LOCK_DIR, `${encodedKey}.lock`);
}

async function readRepositoryAnalysisLock(repositoryKey) {
  const lockPath = getRepositoryAnalysisLockPath(repositoryKey);
  try {
    return JSON.parse(await fs.readFile(lockPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      try {
        const stat = await fs.stat(lockPath);
        return { repositoryKey, updatedAt: new Date(stat.mtimeMs).toISOString(), invalid: true };
      } catch (statError) {
        if (statError.code !== 'ENOENT') console.warn(`Could not inspect repository analysis lock: ${statError.message}`);
      }
    }
    return null;
  }
}

async function acquireRepositoryAnalysisLock(repositoryKey, stage) {
  await fs.mkdir(REPOSITORY_ANALYSIS_LOCK_DIR, { recursive: true });
  const lockPath = getRepositoryAnalysisLockPath(repositoryKey);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const handle = await fs.open(lockPath, 'wx');
      const now = new Date().toISOString();
      const lock = { repositoryKey, owner: REPOSITORY_ANALYSIS_LOCK_OWNER, stage, startedAt: now, updatedAt: now };
      await handle.writeFile(JSON.stringify(lock), 'utf8');
      await handle.close();
      return { ...lock, path: lockPath };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const existing = await readRepositoryAnalysisLock(repositoryKey);
      const updatedAt = Date.parse(existing?.updatedAt || '');
      const lockAge = Number.isFinite(updatedAt)
        ? Date.now() - updatedAt
        : (() => {
          try { return Date.now() - fsSync.statSync(lockPath).mtimeMs; } catch (statError) { return 0; }
        })();
      if (lockAge < REPOSITORY_ANALYSIS_LOCK_STALE_MS) return null;
      try {
        await fs.unlink(lockPath);
      } catch (unlinkError) {
        if (unlinkError.code !== 'ENOENT') return null;
      }
    }
  }
  return null;
}

async function refreshRepositoryAnalysisLock(lock, stage = lock?.stage) {
  if (!lock?.path) return true;
  const current = await readRepositoryAnalysisLock(lock.repositoryKey);
  if (!current || current.owner !== lock.owner) return false;
  const refreshed = { ...current, stage, updatedAt: new Date().toISOString() };
  try {
    await fs.writeFile(lock.path, JSON.stringify(refreshed), 'utf8');
    return true;
  } catch (error) {
    return false;
  }
}

async function releaseRepositoryAnalysisLock(lock) {
  if (!lock?.path) return;
  const current = await readRepositoryAnalysisLock(lock.repositoryKey);
  if (current && current.owner !== lock.owner) return;
  try {
    await fs.unlink(lock.path);
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn(`Could not release repository analysis lock: ${error.message}`);
  }
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
  const codeIndex = clamp(Math.round(100 - scoreValue), 0, 100);
  const now = new Date().toISOString();

  return {
    status: 'live',
    repo,
    branch,
    score: clamp(scoreValue, 0, 100),
    codeIndex,
    evidenceCount: commitSignals + sourceSignals + ignoreSignals,
    commitSignals,
    sourceSignals,
    ignoreSignals,
    density: record.density ?? raw.density ?? null,
    fetchedAt: now
  };
}

async function fetchSlopScore(repo, branch) {
  const endpoint = branch
    ? `https://slopscore.ava.pet/repo/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}`
    : `https://slopscore.ava.pet/repo/${encodeURIComponent(repo)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      headers: { accept: 'application/json' },
      signal: controller.signal
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`Slop Score returned ${response.status}: ${body.slice(0, 160)}`);
    return createSlopPayload(JSON.parse(body), repo, branch);
  } finally {
    clearTimeout(timeout);
  }
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
    } catch (error) {
      // Ignore malformed links from the public catalog.
    }
  }

  return { catalogTotal, entries };
}

async function fetchText(url, accept = 'text/html') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { accept, 'user-agent': 'AI-Countdown-local-backend/0.1' },
      signal: controller.signal
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.slice(0, 160)}`);
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url, 'application/json'));
}

// Reset time of every exhausted GitHub rate-limit resource (core, graphql, search), kept in
// memory only. While it is in the future, requests to that resource fail without calling
// GitHub, so a burst of visitors does not keep hitting a limited token.
const githubRateLimitResets = new Map();

function getGitHubRateLimitResource(url) {
  const pathname = new URL(url).pathname;
  if (pathname === '/graphql') return 'graphql';
  if (pathname === '/search/code') return 'code_search';
  if (pathname.startsWith('/search/')) return 'search';
  return 'core';
}

function getGitHubRateLimitResetAt(resources = ['core', 'graphql']) {
  const now = Date.now();
  let latest = null;
  for (const resource of resources) {
    const resetAt = githubRateLimitResets.get(resource);
    if (!resetAt) continue;
    if (resetAt <= now) {
      githubRateLimitResets.delete(resource);
      continue;
    }
    latest = Math.max(latest || 0, resetAt);
  }
  return latest;
}

function markGitHubRateLimit(resource, resetAt) {
  const until = Number.isFinite(resetAt) && resetAt > Date.now() ? resetAt : Date.now() + GITHUB_RATE_LIMIT_DEFAULT_RETRY_MS;
  githubRateLimitResets.set(resource, Math.max(githubRateLimitResets.get(resource) || 0, until));
  return githubRateLimitResets.get(resource);
}

function readGitHubRateLimitResetAt(headers) {
  const retryAfter = Number(headers.get('retry-after'));
  if (headers.get('retry-after') !== null && Number.isFinite(retryAfter) && retryAfter >= 0) return Date.now() + (retryAfter * 1000);
  const reset = Number(headers.get('x-ratelimit-reset'));
  return headers.get('x-ratelimit-reset') !== null && Number.isFinite(reset) && reset > 0 ? reset * 1000 : null;
}

function createGitHubRateLimitError(message, resetAt) {
  const error = new Error(message);
  error.rateLimited = true;
  error.rateLimitResetAt = resetAt;
  return error;
}

async function fetchGitHubJson(url, options = {}) {
  const resource = getGitHubRateLimitResource(url);
  const blockedUntil = getGitHubRateLimitResetAt([resource]);
  if (blockedUntil) {
    throw createGitHubRateLimitError(`GitHub API rate limit (${resource}) is exhausted until ${new Date(blockedUntil).toISOString()}`, blockedUntil);
  }
  const headers = {
    accept: 'application/vnd.github+json',
    'user-agent': 'AI-Countdown-local-backend/0.1',
    'x-github-api-version': '2022-11-28',
    ...(options.headers || {})
  };
  const token = getGithubApiToken();
  if (token) headers.authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    const body = await response.text();
    const limitResource = response.headers.get('x-ratelimit-resource') || resource;
    const remainingIsZero = response.headers.get('x-ratelimit-remaining') === '0';
    if (!response.ok) {
      const rateLimited = (response.status === 403 || response.status === 429)
        && (/rate limit/i.test(body) || remainingIsZero || response.headers.get('retry-after') !== null);
      const error = new Error(`GitHub API returned ${response.status}${rateLimited && !/rate limit/i.test(body) ? ' (rate limit)' : ''}: ${body.slice(0, 240)}`);
      error.status = response.status;
      if (rateLimited) {
        error.rateLimited = true;
        error.rateLimitResetAt = markGitHubRateLimit(limitResource, readGitHubRateLimitResetAt(response.headers));
      }
      throw error;
    }
    // The last request of the hour still succeeds; the next ones fail fast until the reset.
    if (remainingIsZero) markGitHubRateLimit(limitResource, readGitHubRateLimitResetAt(response.headers));
    return body ? JSON.parse(body) : {};
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGitHubGraphQL(query, variables) {
  return fetchGitHubJson(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
}

// GraphQL reports most failures, rate limits included, as HTTP 200 with an errors array.
async function fetchGitHubGraphQLData(query, variables) {
  const payload = await fetchGitHubGraphQL(query, variables);
  const errors = Array.isArray(payload?.errors) ? payload.errors : [];
  if (errors.length) {
    const message = errors.map((item) => item?.message).filter(Boolean).join('; ').slice(0, 240) || 'unknown error';
    const rateLimited = errors.some((item) => item?.type === 'RATE_LIMITED' || /rate limit/i.test(item?.message || ''));
    const error = new Error(`GitHub GraphQL returned errors${rateLimited && !/rate limit/i.test(message) ? ' (rate limit)' : ''}: ${message}`);
    if (rateLimited) {
      error.rateLimited = true;
      error.rateLimitResetAt = getGitHubRateLimitResetAt(['graphql']) || markGitHubRateLimit('graphql', null);
    }
    throw error;
  }
  if (!payload?.data) throw new Error('GitHub GraphQL returned no data');
  return payload.data;
}

function isGitHubRateLimitError(error) {
  return Boolean(error?.rateLimited) || /rate limit/i.test(String(error?.message || ''));
}

function findGitHubRateLimitError(items) {
  return (items || []).map((item) => item?.error).find(isGitHubRateLimitError) || null;
}

// HTTP 503 for API clients: `retryAt` is when GitHub accepts requests again; the UI shows it
// in the visitor's time zone, the message keeps a UTC time as a fallback.
function githubRateLimitHttpError(resetAt) {
  const time = Number(resetAt);
  const retryAt = Number.isFinite(time) && time > 0 ? new Date(time).toISOString() : null;
  const availableAt = retryAt ? new Date(Math.ceil(time / 60_000) * 60_000).toISOString().slice(11, 16) : null;
  const error = repositoryAnalysisError(
    availableAt ? `Лимит запросов к GitHub API исчерпан. Будет доступно после ${availableAt} UTC.` : GITHUB_RATE_LIMIT_MESSAGE,
    503
  );
  error.code = 'github-rate-limit';
  error.retryAt = retryAt;
  return error;
}

function toGitHubRateLimitHttpError(error) {
  if (error?.code === 'github-rate-limit') return error;
  return githubRateLimitHttpError(error?.rateLimitResetAt || getGitHubRateLimitResetAt());
}

function getGithubWindow(windowDays) {
  const days = Math.max(30, Math.min(730, Number(windowDays) || 365));
  const to = new Date();
  const from = new Date(to.getTime() - (days * 24 * 60 * 60 * 1000));
  return {
    days,
    from: from.toISOString(),
    to: to.toISOString()
  };
}

function getRepositoryHistoryWindow() {
  return {
    scope: 'all',
    days: null,
    from: null,
    to: new Date().toISOString(),
    label: 'all public commit history'
  };
}

function dateOnly(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function normalizeGithubRepository(repository, fallbackUrl = null) {
  if (!repository) return null;
  const nameWithOwner = repository.nameWithOwner || repository.full_name || repository.name || null;
  if (!nameWithOwner) return null;
  return {
    nameWithOwner,
    url: repository.html_url || repository.url || fallbackUrl || `https://github.com/${nameWithOwner}`,
    commits: Number(repository.commits || repository.commitCount || 0)
  };
}

async function fetchGithubContributorGraphQL(contributor, window) {
  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          totalRepositoriesWithContributedCommits
          totalPullRequestContributions
          commitContributionsByRepository(maxRepositories: 100) {
            repository { nameWithOwner url }
            contributions { totalCount }
          }
          pullRequestContributionsByRepository(maxRepositories: 100) {
            repository { nameWithOwner url }
            contributions { totalCount }
          }
        }
      }
    }
  `;
  const payload = await fetchGitHubGraphQL(query, {
    login: contributor.login,
    from: window.from,
    to: window.to
  });
  if (Array.isArray(payload.errors) && payload.errors.length) {
    throw new Error(payload.errors.map((error) => error.message).join('; '));
  }

  const collection = payload.data?.user?.contributionsCollection;
  if (!collection) throw new Error(`GitHub user not found: ${contributor.login}`);
  const repositoryMap = new Map();
  for (const item of collection.commitContributionsByRepository || []) {
    const repository = normalizeGithubRepository(item.repository);
    if (!repository) continue;
    repository.commits = Number(item.contributions?.totalCount || 0);
    repositoryMap.set(repository.nameWithOwner, repository);
  }
  for (const item of collection.pullRequestContributionsByRepository || []) {
    const repository = normalizeGithubRepository(item.repository);
    if (!repository) continue;
    if (!repositoryMap.has(repository.nameWithOwner)) repositoryMap.set(repository.nameWithOwner, repository);
  }

  return {
    source: 'github-graphql',
    limited: repositoryMap.size >= 100,
    totalCommits: Number(collection.totalCommitContributions || 0),
    totalPullRequests: Number(collection.totalPullRequestContributions || 0),
    totalRepositoriesWithContributedCommits: Number(collection.totalRepositoriesWithContributedCommits || 0),
    repositories: [...repositoryMap.values()].sort((left, right) => right.commits - left.commits)
  };
}

async function fetchGithubContributorSearch(contributor, window) {
  const authorEmails = Array.isArray(contributor.authorEmails)
    ? contributor.authorEmails.filter((email) => typeof email === 'string' && email.trim()).map((email) => email.trim())
    : [];
  const query = [
    `author:${contributor.login}`,
    ...authorEmails.map((email) => `author-email:${email}`),
    `author-date:${dateOnly(window.from)}..${dateOnly(window.to)}`
  ].join(' ');
  const repositoryMap = new Map();
  const seenCommits = new Set();
  let reportedCommits = null;
  let totalCommits = 0;
  let pagesFetched = 0;
  let searchError = null;

  for (let page = 1; page <= GITHUB_SEARCH_MAX_PAGES; page += 1) {
    const endpoint = `${GITHUB_API_URL}/search/commits?q=${encodeURIComponent(query)}&per_page=100&page=${page}&sort=author-date&order=desc`;
    let payload;
    try {
      payload = await fetchGitHubJson(endpoint);
    } catch (error) {
      searchError = error.message;
      break;
    }
    pagesFetched = page;
    if (page === 1) reportedCommits = Number.isFinite(Number(payload.total_count)) ? Number(payload.total_count) : null;
    const items = Array.isArray(payload.items) ? payload.items : [];
    for (const item of items) {
      if (item.sha && seenCommits.has(item.sha)) continue;
      if (item.sha) seenCommits.add(item.sha);
      const repository = normalizeGithubRepository(item.repository);
      if (!repository) continue;
      const existing = repositoryMap.get(repository.nameWithOwner) || repository;
      existing.commits += 1;
      repositoryMap.set(repository.nameWithOwner, existing);
      totalCommits += 1;
    }
    if (items.length < 100 || totalCommits >= 1000 || (reportedCommits !== null && reportedCommits <= totalCommits)) break;
  }

  const capped = totalCommits >= 1000 || (reportedCommits !== null && reportedCommits > totalCommits);
  return {
    source: 'github-search',
    query,
    limited: capped || Boolean(searchError),
    totalCommits,
    reportedCommits: capped ? null : reportedCommits,
    pagesFetched,
    resultCap: GITHUB_SEARCH_MAX_PAGES * 100,
    totalPullRequests: null,
    repositories: [...repositoryMap.values()].sort((left, right) => right.commits - left.commits),
    error: searchError,
    note: authorEmails.length
      ? 'Search uses the GitHub account plus verified author email(s); GitHub Search is capped at 1,000 returned commits.'
      : 'Search uses the GitHub account; GitHub Search is capped at 1,000 returned commits.'
  };
}

function repositoryFromPullRequestSearchItem(item) {
  const apiPrefix = `${GITHUB_API_URL}/repos/`;
  const nameWithOwner = typeof item?.repository_url === 'string' && item.repository_url.startsWith(apiPrefix)
    ? item.repository_url.slice(apiPrefix.length)
    : null;
  if (!nameWithOwner || !nameWithOwner.includes('/')) return null;
  return normalizeGithubRepository({
    nameWithOwner,
    url: `https://github.com/${nameWithOwner}`
  });
}

async function fetchGithubContributorPullRequests(contributor, window) {
  const query = `type:pr author:${contributor.login} created:${dateOnly(window.from)}..${dateOnly(window.to)}`;
  const repositoryMap = new Map();
  let reportedPullRequests = null;
  let totalPullRequests = 0;
  let pagesFetched = 0;
  let searchError = null;

  for (let page = 1; page <= GITHUB_SEARCH_MAX_PAGES; page += 1) {
    const endpoint = `${GITHUB_API_URL}/search/issues?q=${encodeURIComponent(query)}&per_page=100&page=${page}&sort=created&order=desc`;
    let payload;
    try {
      payload = await fetchGitHubJson(endpoint);
    } catch (error) {
      searchError = error.message;
      break;
    }
    pagesFetched = page;
    if (page === 1) reportedPullRequests = Number.isFinite(Number(payload.total_count)) ? Number(payload.total_count) : null;
    const items = Array.isArray(payload.items) ? payload.items : [];
    for (const item of items) {
      const repository = repositoryFromPullRequestSearchItem(item);
      if (!repository) continue;
      const existing = repositoryMap.get(repository.nameWithOwner) || repository;
      existing.pullRequests = (existing.pullRequests || 0) + 1;
      repositoryMap.set(repository.nameWithOwner, existing);
      totalPullRequests += 1;
    }
    if (items.length < 100 || totalPullRequests >= 1000 || (reportedPullRequests !== null && reportedPullRequests <= totalPullRequests)) break;
  }

  const capped = totalPullRequests >= 1000 || (reportedPullRequests !== null && reportedPullRequests > totalPullRequests);
  return {
    source: 'github-pr-search',
    query,
    limited: capped || Boolean(searchError),
    totalPullRequests,
    reportedPullRequests: capped ? null : reportedPullRequests,
    pagesFetched,
    repositories: [...repositoryMap.values()].sort((left, right) => right.pullRequests - left.pullRequests),
    error: searchError,
    note: 'Pull Request search is a separate participation signal and is capped at 1,000 returned results.'
  };
}

function repositoryAnalysisError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// https://github.com/<login> (or a bare login) selects the profile analysis instead of
// a repository analysis.
function normalizePublicGithubProfile(input) {
  if (typeof input !== 'string' || !input.trim()) return null;
  const raw = input.trim().replace(/\/+$/, '');
  if (/^@?[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(raw)) return raw.replace(/^@/, '');
  let parsed;
  try {
    parsed = new URL(raw.includes('://') ? raw : `https://${raw}`);
  } catch (error) {
    return null;
  }
  if (parsed.protocol !== 'https:' || !['github.com', 'www.github.com'].includes(parsed.hostname.toLowerCase())) return null;
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length !== 1) return null;
  const login = decodeURIComponent(parts[0]);
  return /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(login) ? login : null;
}

function normalizePublicGithubRepository(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw repositoryAnalysisError('Укажите публичный GitHub-репозиторий.');
  }

  const raw = input.trim().replace(/\.git\/?$/, '');
  const candidate = raw.includes('://') ? raw : `https://github.com/${raw}`;
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch (error) {
    throw repositoryAnalysisError('Ссылка на репозиторий имеет неверный формат.');
  }

  if (parsed.protocol !== 'https:' || !['github.com', 'www.github.com'].includes(parsed.hostname.toLowerCase())) {
    throw repositoryAnalysisError('Пока поддерживаются только публичные репозитории GitHub.');
  }

  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw repositoryAnalysisError('Нужна ссылка вида https://github.com/owner/repository.');
  }

  const owner = decodeURIComponent(parts[0]);
  const name = decodeURIComponent(parts[1]);
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(name)) {
    throw repositoryAnalysisError('В ссылке найден недопустимый GitHub owner или repository.');
  }

  return {
    owner,
    name,
    fullName: `${owner}/${name}`,
    key: `${owner}/${name}`.toLowerCase(),
    url: `https://github.com/${owner}/${name}`
  };
}

function roundMetric(value, digits = 1) {
  if (!Number.isFinite(Number(value))) return null;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function getRepositoryAnalysisDurationMs(analysis) {
  const rawDuration = analysis?.analysisDurationMs;
  const explicitDuration = Number(rawDuration);
  if (rawDuration !== null && rawDuration !== undefined && rawDuration !== '' && Number.isFinite(explicitDuration) && explicitDuration >= 0) {
    return Math.round(explicitDuration);
  }

  const requestedAt = Date.parse(analysis?.requestedAt || '');
  const fetchedAt = Date.parse(analysis?.fetchedAt || '');
  if (Number.isFinite(requestedAt) && Number.isFinite(fetchedAt) && fetchedAt >= requestedAt) {
    return fetchedAt - requestedAt;
  }
  return null;
}

function withRepositoryAnalysisDuration(analysis) {
  const durationMs = getRepositoryAnalysisDurationMs(analysis);
  return {
    ...analysis,
    analysisDurationMs: durationMs,
    analysisDurationSeconds: Number.isFinite(durationMs) ? roundMetric(durationMs / 1000) : null
  };
}

function matchesAgentPattern(value, patterns) {
  if (!value || !Array.isArray(patterns)) return false;
  const normalized = String(value).trim().toLowerCase();
  return patterns.some((pattern) => {
    const candidate = String(pattern || '').trim().toLowerCase();
    return candidate && (normalized === candidate || normalized.includes(candidate));
  });
}

function isBotLikeIdentity(value) {
  return /\[bot\]$|\(aider\)|(^|[^a-z])(bot|agent|assistant)([^a-z]|$)/.test(String(value || '').trim().toLowerCase());
}

// Logins and display names belong to people as often as to agents ("Claude Monet",
// "devin-smith"), so a substring is enough only when the identity itself looks automated.
function matchesAgentIdentity(value, patterns) {
  if (!value || !Array.isArray(patterns)) return false;
  const normalized = String(value).trim().toLowerCase();
  const botLike = isBotLikeIdentity(normalized);
  return patterns.some((pattern) => {
    const candidate = String(pattern || '').trim().toLowerCase();
    if (!candidate) return false;
    if (normalized === candidate || normalized === `${candidate}[bot]`) return true;
    return botLike && normalized.includes(candidate);
  });
}

// A personal address such as claude.martin@gmail.com or jane@anthropic.com is not an
// agent marker. Accept GitHub noreply addresses of agent accounts, automated local parts
// (noreply, bot, agent) and addresses whose local part and domain both name the agent.
function matchesAgentEmail(value, agent) {
  const email = String(value || '').trim().toLowerCase();
  const at = email.lastIndexOf('@');
  if (at <= 0) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const emailPatterns = Array.isArray(agent?.emailPatterns) ? agent.emailPatterns : [];
  const identityPatterns = [...(Array.isArray(agent?.loginPatterns) ? agent.loginPatterns : []), ...emailPatterns];
  if (domain === 'users.noreply.github.com') {
    return matchesAgentIdentity(local.includes('+') ? local.slice(local.indexOf('+') + 1) : local, identityPatterns);
  }
  if (!matchesAgentPattern(email, emailPatterns)) return false;
  const automatedLocal = /(^|[^a-z])(no-?reply|bot|agent)([^a-z]|$)/.test(local) || isBotLikeIdentity(local);
  return automatedLocal
    || (matchesAgentPattern(local, identityPatterns) && matchesAgentPattern(domain, identityPatterns));
}

function getRepositoryCommitContributor(commit, detail) {
  const profile = detail?.author || commit?.author || detail?.committer || commit?.committer || {};
  const login = profile.login || null;
  const name = detail?.commit?.author?.name
    || commit?.commit?.author?.name
    || detail?.commit?.committer?.name
    || commit?.commit?.committer?.name
    || profile.name
    || login
    || 'Unknown contributor';
  return {
    login,
    name,
    avatarUrl: profile.avatar_url || null,
    profileUrl: profile.html_url || (login ? `https://github.com/${encodeURIComponent(login)}` : null)
  };
}

function getRepositoryCommitCoAuthors(commit, detail) {
  const commitMessage = String(detail?.commit?.message || commit?.commit?.message || '');
  return commitMessage
    .split(/\r?\n/)
    .map((line) => {
      const trailer = line.match(/^co-authored-by\s*:\s*(.+)$/i)?.[1]?.trim();
      if (!trailer) return null;
      const email = trailer.match(/<([^>]+)>/)?.[1]?.trim() || null;
      const name = trailer.replace(/<[^>]+>/g, '').trim() || null;
      return { name, email };
    })
    .filter(Boolean);
}

function classifyRepositoryCommit(commit, detail, agents) {
  const coAuthors = getRepositoryCommitCoAuthors(commit, detail);
  const candidates = [
    { kind: 'login', value: detail?.author?.login || commit?.author?.login },
    { kind: 'login', value: detail?.committer?.login || commit?.committer?.login },
    { kind: 'email', value: detail?.commit?.author?.email || commit?.commit?.author?.email },
    { kind: 'email', value: detail?.commit?.committer?.email || commit?.commit?.committer?.email },
    { kind: 'name', value: detail?.commit?.author?.name || commit?.commit?.author?.name },
    { kind: 'name', value: detail?.commit?.committer?.name || commit?.commit?.committer?.name },
    ...coAuthors.flatMap((coAuthor) => [
      { kind: 'co-author-name', value: coAuthor.name },
      { kind: 'co-author-email', value: coAuthor.email }
    ])
  ].filter((candidate) => candidate.value);

  for (const agent of agents) {
    const matched = candidates.find((candidate) => (
      candidate.kind === 'email' || candidate.kind === 'co-author-email'
        ? matchesAgentEmail(candidate.value, agent)
        : matchesAgentIdentity(candidate.value, agent.loginPatterns)
    ));
    if (matched) {
      return {
        kind: 'ai',
        agentId: agent.id,
        agentLabel: agent.label,
        matchedBy: matched.kind.startsWith('co-author') ? 'co-author' : matched.kind
      };
    }
  }

  const contributorProfile = getRepositoryCommitContributor(commit, detail);
  return {
    kind: 'human',
    agentId: null,
    agentLabel: null,
    matchedBy: null,
    contributor: contributorProfile.login || contributorProfile.name,
    contributorLogin: contributorProfile.login,
    contributorProfile
  };
}

function applyRepositoryContributorHeuristic(classification, contributorHeuristics = {}) {
  if (classification?.kind !== 'human' || !classification.contributorLogin) return classification;
  const heuristic = contributorHeuristics[classification.contributorLogin.toLowerCase()];
  if (!heuristic?.inferredAgentId) return classification;
  return {
    ...classification,
    kind: 'ai',
    agentId: heuristic.inferredAgentId,
    agentLabel: heuristic.inferredAgentLabel,
    matchedBy: 'author-repository-heuristic',
    inferredFrom: heuristic
  };
}

function getRepositoryContributorHeuristic(classification, contributorHeuristics = {}) {
  if (classification?.kind !== 'human' || !classification.contributorLogin) return null;
  return contributorHeuristics[classification.contributorLogin.toLowerCase()] || null;
}

function applyRepositoryContributorProfileSignal(entry, heuristic, attributed = false) {
  if (!entry || !heuristic) return;
  entry.favoriteAgentStatus = heuristic.status || null;
  entry.favoriteAgentId = heuristic.likelyAgentId || null;
  entry.favoriteAgentLabel = heuristic.likelyAgentLabel || null;
  entry.favoriteAgentShare = Number.isFinite(Number(heuristic.likelyAgentShare))
    ? heuristic.likelyAgentShare
    : null;
  if (attributed && heuristic.inferredAgentId) {
    entry.attributedAgentId = heuristic.inferredAgentId;
    entry.attributedAgentLabel = heuristic.inferredAgentLabel;
    entry.attributedAgentShare = heuristic.likelyAgentShare;
  }
}

function getRepositoryHumanHeuristicCandidates(detailed, agents, limit = REPOSITORY_ANALYSIS_AUTHOR_HEURISTIC_MAX_CONTRIBUTORS) {
  const candidates = new Map();
  for (const item of detailed || []) {
    if (!item?.detail || item.error) continue;
    const classification = classifyRepositoryCommit(item.commit, item.detail, agents);
    if (classification.kind !== 'human' || !classification.contributorLogin) continue;
    const stats = item.detail.stats || {};
    const changedLines = Math.max(0, Number(stats.additions) || 0) + Math.max(0, Number(stats.deletions) || 0);
    const key = classification.contributorLogin.toLowerCase();
    const candidate = candidates.get(key) || {
      login: classification.contributorLogin,
      name: classification.contributorProfile?.name || classification.contributorLogin,
      changedLines: 0,
      commits: 0
    };
    candidate.changedLines += changedLines;
    candidate.commits += 1;
    candidates.set(key, candidate);
  }
  return [...candidates.values()]
    .sort((left, right) => right.changedLines - left.changedLines)
    .slice(0, limit);
}

async function fetchRepositoryAuthorRepositories(login, excludedRepositoryKey, maxRepositories = REPOSITORY_ANALYSIS_AUTHOR_HEURISTIC_MAX_REPOSITORIES) {
  const endpoint = new URL(`${GITHUB_API_URL}/users/${encodeURIComponent(login)}/repos`);
  endpoint.searchParams.set('type', 'owner');
  endpoint.searchParams.set('sort', 'pushed');
  endpoint.searchParams.set('direction', 'desc');
  endpoint.searchParams.set('per_page', '30');
  const payload = await fetchGitHubJson(endpoint.toString());
  return (Array.isArray(payload) ? payload : [])
    .filter((item) => item?.full_name
      && item.owner?.login?.toLowerCase() === login.toLowerCase()
      && !item.fork
      && item.default_branch)
    .map((item) => ({
      owner: item.owner?.login || item.owner?.name || login,
      name: item.name,
      fullName: item.full_name,
      key: item.full_name.toLowerCase(),
      url: item.html_url || `https://github.com/${item.full_name}`,
      defaultBranch: item.default_branch,
      pushedAt: item.pushed_at || null
    }))
    .filter((item) => item.key !== excludedRepositoryKey)
    .slice(0, maxRepositories);
}

function createFallbackRepositoryAuthorProfile(login) {
  return {
    login,
    name: login,
    avatarUrl: null,
    profileUrl: `https://github.com/${encodeURIComponent(login)}`,
    publicRepos: null
  };
}

async function fetchRepositoryAuthorProfile(login) {
  try {
    const payload = await fetchGitHubJson(`${GITHUB_API_URL}/users/${encodeURIComponent(login)}`);
    return {
      login: payload.login || login,
      name: payload.name || payload.login || login,
      avatarUrl: payload.avatar_url || null,
      profileUrl: payload.html_url || `https://github.com/${encodeURIComponent(login)}`,
      publicRepos: Number(payload.public_repos || 0)
    };
  } catch (error) {
    if (isGitHubRateLimitError(error)) throw error;
    return createFallbackRepositoryAuthorProfile(login);
  }
}

async function inferRepositoryContributorAgent(login, agents, window, excludedRepositoryKey, { maxRepositories = REPOSITORY_ANALYSIS_AUTHOR_HEURISTIC_MAX_REPOSITORIES } = {}) {
  if (!login) return null;
  let profile = createFallbackRepositoryAuthorProfile(login);
  try {
    profile = await fetchRepositoryAuthorProfile(login);
    const repositories = await fetchRepositoryAuthorRepositories(login, excludedRepositoryKey, maxRepositories);
    if (!repositories.length) {
      return {
        login,
        profile,
        excludedRepositoryKey,
        classificationVersion: REPOSITORY_ANALYSIS_CLASSIFICATION_VERSION,
        maxRepositories,
        status: 'insufficient-data',
        likelyAgentId: null,
        likelyAgentLabel: null,
        likelyAgentCommitShare: null,
        likelyAgentShare: null,
        inferredAgentId: null,
        inferredAgentLabel: null,
        sampledRepositories: 0,
        sampledRepositoryList: [],
        sampledCommits: 0,
        sampledChangedLines: 0,
        threshold: 50,
        passesThreshold: false,
        matchedBy: 'author-repository-heuristic'
      };
    }
    const samples = await mapWithConcurrency(repositories, async (repository) => {
      const sample = await fetchRepositoryAnalysisPage(repository, window, {
        page: 1,
        perPage: REPOSITORY_ANALYSIS_AUTHOR_HEURISTIC_MAX_COMMITS_PER_REPOSITORY,
        concurrency: REPOSITORY_ANALYSIS_AUTHOR_HEURISTIC_CONCURRENCY
      });
      return { repository, detailed: sample.items };
    }, 2);
    // A rate-limited sample would silently shrink the profile, so the whole lookup fails.
    const rateLimitError = findGitHubRateLimitError(samples);
    if (rateLimitError) throw rateLimitError;

    const agentTotals = new Map();
    const normalizedLogin = login.toLowerCase();
    let contributorChangedLines = 0;
    let contributorCommits = 0;
    let sampledChangedLines = 0;
    let sampledCommits = 0;
    let skippedForeignCommits = 0;
    const sampledRepositories = [];
    const failedRepositories = [];
    samples.forEach((sample, index) => {
      // mapWithConcurrency turns a rejected repository (for example an empty one, which
      // GitHub answers with 409) into { error }; the other repositories remain usable.
      if (!sample?.repository) {
        failedRepositories.push({
          fullName: repositories[index]?.fullName || null,
          error: sample?.error?.message || 'Repository sample is unavailable'
        });
        return;
      }
      sampledRepositories.push({
        fullName: sample.repository.fullName,
        url: sample.repository.url,
        defaultBranch: sample.repository.defaultBranch
      });
      for (const item of sample.detailed || []) {
        if (!item?.detail || item.error) continue;
        const stats = item.detail.stats || {};
        const changedLines = Math.max(0, Number(stats.additions) || 0) + Math.max(0, Number(stats.deletions) || 0);
        const classification = classifyRepositoryCommit(item.commit, item.detail, agents);
        const authorLogin = getRepositoryCommitContributor(item.commit, item.detail).login?.toLowerCase() || null;
        // Only the contributor's own work describes their habits: their human commits,
        // their commits with an agent co-author, and commits made by an agent account.
        // A collaborator's Claude commits in the same repository must not count.
        const ownAgentCommit = classification.kind === 'ai'
          && (!authorLogin || authorLogin === normalizedLogin || isBotLikeIdentity(authorLogin) || agents.some((agent) => matchesAgentIdentity(authorLogin, agent.loginPatterns)));
        if (classification.kind === 'ai' && ownAgentCommit) {
          const current = agentTotals.get(classification.agentId) || {
            agentId: classification.agentId,
            agentLabel: classification.agentLabel,
            changedLines: 0,
            commits: 0
          };
          current.changedLines += changedLines;
          current.commits += 1;
          agentTotals.set(classification.agentId, current);
        } else if (classification.kind === 'human' && classification.contributorLogin?.toLowerCase() === normalizedLogin) {
          contributorChangedLines += changedLines;
          contributorCommits += 1;
        } else {
          skippedForeignCommits += 1;
          continue;
        }
        sampledCommits += 1;
        sampledChangedLines += changedLines;
      }
    });

    if (!sampledRepositories.length) {
      throw new Error(failedRepositories.map((repository) => `${repository.fullName}: ${repository.error}`).join('; ') || 'No repository sample is available');
    }

    const topAgent = [...agentTotals.values()].sort((left, right) => right.changedLines - left.changedLines)[0] || null;
    const likelyAgentShare = sampledChangedLines
      ? roundMetric((Number(topAgent?.changedLines || 0) / sampledChangedLines) * 100)
      : null;
    const likelyAgentCommitShare = sampledCommits
      ? roundMetric((Number(topAgent?.commits || 0) / sampledCommits) * 100)
      : null;
    const enoughCommits = sampledCommits >= REPOSITORY_ANALYSIS_AUTHOR_HEURISTIC_MIN_COMMITS;
    const passesThreshold = enoughCommits
      && Number.isFinite(likelyAgentCommitShare)
      && likelyAgentCommitShare > 50
      && Number.isFinite(likelyAgentShare)
      && likelyAgentShare > 50;
    const status = !enoughCommits ? 'insufficient-data' : topAgent ? 'ok' : 'no-agent';
    return {
      login,
      profile,
      excludedRepositoryKey,
      classificationVersion: REPOSITORY_ANALYSIS_CLASSIFICATION_VERSION,
      maxRepositories,
      status,
      minCommits: REPOSITORY_ANALYSIS_AUTHOR_HEURISTIC_MIN_COMMITS,
      skippedForeignCommits,
      failedRepositories,
      likelyAgentId: topAgent?.agentId || null,
      likelyAgentLabel: topAgent?.agentLabel || null,
      likelyAgentCommitShare,
      likelyAgentShare,
      inferredAgentId: passesThreshold ? topAgent.agentId : null,
      inferredAgentLabel: passesThreshold ? topAgent.agentLabel : null,
      agents: [...agentTotals.values()]
        .sort((left, right) => right.changedLines - left.changedLines)
        .map((agent) => ({
          ...agent,
          changedShare: sampledChangedLines ? roundMetric((agent.changedLines / sampledChangedLines) * 100) : null,
          commitShare: sampledCommits ? roundMetric((agent.commits / sampledCommits) * 100) : null
        })),
      humanChangedShare: sampledChangedLines ? roundMetric((contributorChangedLines / sampledChangedLines) * 100) : null,
      humanCommitShare: sampledCommits ? roundMetric((contributorCommits / sampledCommits) * 100) : null,
      agentChangedLines: Number(topAgent?.changedLines || 0),
      agentCommits: Number(topAgent?.commits || 0),
      contributorChangedLines,
      contributorCommits,
      sampledChangedLines,
      sampledRepositories: sampledRepositories.length,
      sampledRepositoryList: sampledRepositories,
      sampledCommits,
      threshold: 50,
      passesThreshold,
      matchedBy: 'author-repository-heuristic',
      note: status === 'no-agent'
        ? "No recognized AI agent was found in the contributor's own commits across the sampled repositories they own."
        : "Shares are measured on the contributor's own commits (including agent co-authored ones) in repositories they own; attribution needs more than 50% of those commits and changed lines."
    };
  } catch (error) {
    return {
      login,
      profile,
      excludedRepositoryKey,
      classificationVersion: REPOSITORY_ANALYSIS_CLASSIFICATION_VERSION,
      maxRepositories,
      status: 'unavailable',
      error: error.message,
      likelyAgentId: null,
      likelyAgentLabel: null,
      likelyAgentCommitShare: null,
      likelyAgentShare: null,
      inferredAgentId: null,
      inferredAgentLabel: null,
      sampledRepositories: 0,
      sampledRepositoryList: [],
      sampledCommits: 0,
      sampledChangedLines: 0,
      threshold: 50,
      passesThreshold: false,
      matchedBy: 'author-repository-heuristic'
    };
  }
}

async function inferRepositoryContributorAgents(detailed, agents, window, excludedRepositoryKey) {
  const candidates = getRepositoryHumanHeuristicCandidates(detailed, agents);
  const profileCache = await readContributorProfilesCache({ version: 1, profiles: {} });
  const profiles = { ...(profileCache.profiles || {}) };
  const inferred = await mapWithConcurrency(candidates, async (candidate) => {
    const cached = profiles[candidate.login.toLowerCase()];
    const checkedAt = Date.parse(cached?.checkedAt || '');
    // Failed lookups (rate limits, timeouts) are retried on the next analysis instead of
    // being reused for a week; profiles from an older classifier are recomputed.
    if (cached
      && cached.status !== 'unavailable'
      && Number(cached.classificationVersion) === REPOSITORY_ANALYSIS_CLASSIFICATION_VERSION
      && Number(cached.maxRepositories) === REPOSITORY_ANALYSIS_AUTHOR_HEURISTIC_MAX_REPOSITORIES
      && cached.excludedRepositoryKey === excludedRepositoryKey
      && Number.isFinite(checkedAt)
      && Date.now() - checkedAt < REPOSITORY_ANALYSIS_AUTHOR_PROFILE_CACHE_TTL_MS) {
      return { ...cached, fromCache: true };
    }
    return inferRepositoryContributorAgent(
      candidate.login,
      agents,
      window,
      excludedRepositoryKey
    );
  }, 2);
  const rateLimitedLogins = inferred
    .filter((item) => item?.login && item.status === 'unavailable' && isGitHubRateLimitError({ message: item.error }))
    .map((item) => item.login);
  const refreshed = inferred
    .filter((item) => item?.login && !rateLimitedLogins.includes(item.login))
    .map((item) => {
      const { fromCache, ...profile } = item;
      return fromCache
        ? profile
        : {
          ...profile,
          checkedAt: new Date().toISOString(),
          source: 'owned-public-repositories'
        };
    });
  refreshed.forEach((item) => {
    profiles[item.login.toLowerCase()] = item;
  });
  if (refreshed.length) await writeContributorProfilesCache({ version: 1, profiles });
  // Without these profiles the author-repository heuristic would attribute fewer commits,
  // so a rate limit fails the analysis instead of storing a weaker result.
  if (rateLimitedLogins.length) {
    throw createGitHubRateLimitError(`GitHub API rate limit while sampling repositories of ${rateLimitedLogins.join(', ')}`, getGitHubRateLimitResetAt());
  }
  return Object.fromEntries(
    refreshed.map((item) => [item.login.toLowerCase(), item])
  );
}

async function fetchRepositoryCommitPage(repository, window, page, perPage = 100) {
  const repoPath = `${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
  const endpoint = new URL(`${GITHUB_API_URL}/repos/${repoPath}/commits`);
  endpoint.searchParams.set('per_page', String(perPage));
  endpoint.searchParams.set('page', String(page));
  if (window?.from) endpoint.searchParams.set('since', window.from);
  if (window?.to && window?.scope !== 'all') endpoint.searchParams.set('until', window.to);
  endpoint.searchParams.set('sha', repository.defaultBranch);
  const payload = await fetchGitHubJson(endpoint.toString());
  return Array.isArray(payload) ? payload : [];
}

async function fetchRepositoryCommitDetail(repository, sha) {
  const repoPath = `${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
  return fetchGitHubJson(`${GITHUB_API_URL}/repos/${repoPath}/commits/${encodeURIComponent(sha)}`);
}

// One GraphQL page carries the line stats of up to 100 commits, which REST only returns
// one commit per request. The nodes are mapped to the REST list/detail shape below, so
// classification, heuristics and stored analyses do not depend on the source.
const REPOSITORY_HISTORY_GRAPHQL_QUERY = `query RepositoryHistory($owner: String!, $name: String!, $expression: String!, $first: Int!, $after: String, $since: GitTimestamp, $until: GitTimestamp) {
  repository(owner: $owner, name: $name) {
    object(expression: $expression) {
      ... on Commit {
        history(first: $first, after: $after, since: $since, until: $until) {
          pageInfo { hasNextPage endCursor }
          totalCount
          nodes {
            oid
            url
            message
            committedDate
            authoredDate
            additions
            deletions
            changedFilesIfAvailable
            parents { totalCount }
            author { name email date user { login avatarUrl url } }
            committer { name email date user { login avatarUrl url } }
          }
        }
      }
    }
  }
}`;

// Two kinds of commit accounts differ between the APIs: GraphQL leaves `user` empty for
// noreply@github.com (REST: web-flow), and gives GitHub App bots a github.com/<login> URL
// (REST: github.com/apps/<slug>, e.g. Copilot -> apps/copilot-swe-agent). Their REST account
// is learned from the first REST commit detail with that email and reused for later commits.
const githubRestAccountsByEmail = new Map();
const GITHUB_REST_ACCOUNTS_BY_EMAIL_LIMIT = 5000;

function normalizeGitEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isGitHubNoreplyEmail(email) {
  const value = normalizeGitEmail(email);
  return value === 'noreply@github.com' || value.endsWith('@users.noreply.github.com');
}

function isGitHubAppBotUser(user) {
  return /\/in\/\d+/.test(String(user?.avatarUrl || '')) || /\[bot\]$/i.test(String(user?.login || ''));
}

function usesRestAccountByEmail(actor) {
  return actor?.user?.login ? isGitHubAppBotUser(actor.user) : isGitHubNoreplyEmail(actor?.email);
}

function needsGitHubAccountLookup(actor) {
  return usesRestAccountByEmail(actor) && !githubRestAccountsByEmail.has(normalizeGitEmail(actor.email));
}

function rememberGitHubRestAccounts(detail) {
  [[detail?.commit?.author, detail?.author], [detail?.commit?.committer, detail?.committer]].forEach(([gitActor, account]) => {
    const email = normalizeGitEmail(gitActor?.email);
    if (!email || !(isGitHubNoreplyEmail(email) || account?.type === 'Bot')) return;
    if (!githubRestAccountsByEmail.has(email) && githubRestAccountsByEmail.size >= GITHUB_REST_ACCOUNTS_BY_EMAIL_LIMIT) {
      githubRestAccountsByEmail.delete(githubRestAccountsByEmail.keys().next().value);
    }
    githubRestAccountsByEmail.set(email, account?.login
      ? { login: account.login, avatar_url: account.avatar_url || null, html_url: account.html_url || null }
      : null);
  });
}

// GraphQL adds a cache-busting `u=<hash>` to custom avatars; REST links them as `?v=4`.
function restAvatarUrlFromGraphQL(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname !== 'avatars.githubusercontent.com') return value;
    url.searchParams.delete('u');
    return url.toString();
  } catch (error) {
    return value;
  }
}

function restAccountFromGraphQLActor(actor) {
  const email = normalizeGitEmail(actor?.email);
  if (usesRestAccountByEmail(actor) && githubRestAccountsByEmail.has(email)) return githubRestAccountsByEmail.get(email);
  const user = actor?.user;
  if (!user?.login) return null;
  return {
    login: user.login,
    avatar_url: restAvatarUrlFromGraphQL(user.avatarUrl),
    html_url: user.url || `https://github.com/${encodeURIComponent(user.login)}`
  };
}

// REST writes commit dates in UTC without milliseconds; GitActor.date keeps the author's offset.
function normalizeGitHubTimestamp(value) {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? new Date(time).toISOString().replace(/\.\d{3}Z$/, 'Z') : value || null;
}

function isCompleteGraphQLHistoryNode(node) {
  return typeof node?.oid === 'string' && Boolean(node.oid)
    && typeof node.message === 'string'
    && Number.isFinite(node.additions)
    && Number.isFinite(node.deletions)
    && Boolean(node.author)
    && Boolean(node.committer);
}

// Commits whose changed-file count GitHub could not compute, or whose REST `files` list
// would be capped, are read from REST so stats and file counts stay exactly the same.
function graphqlHistoryNodeNeedsRestDetail(node) {
  const changedFiles = node.changedFilesIfAvailable;
  return !Number.isInteger(changedFiles) || changedFiles > GITHUB_REST_COMMIT_FILES_LIMIT;
}

function graphqlHistoryNodeToRest(node) {
  const commit = {
    sha: node.oid,
    html_url: node.url || null,
    author: restAccountFromGraphQLActor(node.author),
    committer: restAccountFromGraphQLActor(node.committer),
    commit: {
      author: {
        name: node.author.name ?? null,
        email: node.author.email ?? null,
        date: normalizeGitHubTimestamp(node.authoredDate || node.author.date)
      },
      committer: {
        name: node.committer.name ?? null,
        email: node.committer.email ?? null,
        date: normalizeGitHubTimestamp(node.committedDate || node.committer.date)
      },
      message: node.message
    }
  };
  const changedFiles = Math.min(GITHUB_REST_COMMIT_FILES_LIMIT, Math.max(0, Number(node.changedFilesIfAvailable) || 0));
  return {
    commit,
    detail: {
      ...commit,
      stats: { total: node.additions + node.deletions, additions: node.additions, deletions: node.deletions },
      files: Array.from({ length: changedFiles }, () => ({}))
    }
  };
}

async function fetchRepositoryHistoryGraphQLPage(repository, window, { first, after = null }) {
  const data = await fetchGitHubGraphQLData(REPOSITORY_HISTORY_GRAPHQL_QUERY, {
    owner: repository.owner,
    name: repository.name,
    expression: repository.defaultBranch,
    first,
    after,
    since: window?.from || null,
    until: window?.to && window?.scope !== 'all' ? window.to : null
  });
  const history = data?.repository?.object?.history;
  const pageInfo = history?.pageInfo;
  if (!Array.isArray(history?.nodes) || !pageInfo || (pageInfo.hasNextPage && !pageInfo.endCursor)) {
    throw new Error('GitHub GraphQL returned no commit history for the default branch');
  }
  if (!history.nodes.every(isCompleteGraphQLHistoryNode)) {
    throw new Error('GitHub GraphQL commit history is missing required fields');
  }
  return {
    nodes: history.nodes,
    hasNextPage: Boolean(pageInfo.hasNextPage),
    endCursor: pageInfo.endCursor || null,
    totalCount: Number.isFinite(Number(history.totalCount)) ? Number(history.totalCount) : null
  };
}

// Line stats of large diffs can time out a 100-commit page. Smaller pages over the same
// cursor return the same commits, so they are tried before the page falls back to REST.
async function fetchRepositoryHistoryGraphQL(repository, window, { first, after = null }) {
  try {
    return await fetchRepositoryHistoryGraphQLPage(repository, window, { first, after });
  } catch (error) {
    const chunkSize = 25;
    if (isGitHubRateLimitError(error) || first <= chunkSize) throw error;
    const nodes = [];
    let cursor = after;
    let hasNextPage = true;
    let totalCount = null;
    while (nodes.length < first && hasNextPage) {
      const chunk = await fetchRepositoryHistoryGraphQLPage(repository, window, { first: Math.min(chunkSize, first - nodes.length), after: cursor });
      nodes.push(...chunk.nodes);
      hasNextPage = chunk.hasNextPage;
      cursor = chunk.endCursor;
      if (Number.isFinite(Number(chunk.totalCount))) totalCount = Number(chunk.totalCount);
      if (!chunk.nodes.length) {
        if (hasNextPage) throw error;
        break;
      }
    }
    return {
      nodes,
      hasNextPage,
      endCursor: hasNextPage ? cursor : null,
      totalCount
    };
  }
}

async function detailRepositoryHistoryNodes(repository, nodes, concurrency) {
  const restDetails = new Map();
  const fetchDetails = async (indexes) => {
    const results = await mapWithConcurrency(indexes, async (index) => {
      try {
        const detail = await fetchRepositoryCommitDetail(repository, nodes[index].oid);
        rememberGitHubRestAccounts(detail);
        return { index, detail };
      } catch (error) {
        return { index, error };
      }
    }, concurrency);
    const rateLimitError = findGitHubRateLimitError(results);
    if (rateLimitError) throw rateLimitError;
    results.forEach((result) => restDetails.set(result.index, result));
  };

  // First pass: commits that need REST stats, plus the first commit of every bot or noreply
  // email whose REST account is not known yet. Second pass: commits whose email is still
  // unknown because that first REST call failed.
  const firstPass = [];
  const lookupEmails = new Set();
  nodes.forEach((node, index) => {
    const emails = [node.author, node.committer].filter(needsGitHubAccountLookup).map((actor) => normalizeGitEmail(actor.email));
    if (graphqlHistoryNodeNeedsRestDetail(node) || emails.some((email) => !lookupEmails.has(email))) firstPass.push(index);
    emails.forEach((email) => lookupEmails.add(email));
  });
  if (firstPass.length) await fetchDetails(firstPass);
  const secondPass = nodes
    .map((node, index) => index)
    .filter((index) => !restDetails.has(index) && [nodes[index].author, nodes[index].committer].some(needsGitHubAccountLookup));
  if (secondPass.length) await fetchDetails(secondPass);

  return nodes.map((node, index) => {
    const adapted = graphqlHistoryNodeToRest(node);
    const rest = restDetails.get(index);
    if (!rest) return adapted;
    if (rest.error) return { commit: adapted.commit, detail: null, error: rest.error };
    return {
      commit: { ...adapted.commit, author: rest.detail.author ?? null, committer: rest.detail.committer ?? null },
      detail: rest.detail
    };
  });
}

// Returns one page of commits with their REST-shaped details. GraphQL is used with a token
// for the first page or when a cursor is known; otherwise, and whenever GraphQL fails for
// a reason other than a rate limit, the page is read from REST (one call per commit).
async function fetchRepositoryAnalysisPage(repository, window, {
  page,
  cursor = null,
  useGraphQL = true,
  perPage = 100,
  concurrency = REPOSITORY_ANALYSIS_CONCURRENCY
}) {
  if (useGraphQL && getGithubApiToken() && (page === 1 || cursor)) {
    try {
      const history = await fetchRepositoryHistoryGraphQL(repository, window, { first: perPage, after: page === 1 ? null : cursor });
      const items = await detailRepositoryHistoryNodes(repository, history.nodes, concurrency);
      return {
        items,
        listedCommits: history.nodes.length,
        hasMore: history.hasNextPage,
        cursor: history.hasNextPage ? history.endCursor : null,
        totalCommits: history.totalCount,
        source: 'graphql'
      };
    } catch (error) {
      if (isGitHubRateLimitError(error)) throw error;
      console.warn(`GitHub GraphQL history failed for ${repository.fullName || repository.key} page ${page}, using REST: ${error.message}`);
    }
  }

  const commits = await fetchRepositoryCommitPage(repository, window, page, perPage);
  const items = await mapWithConcurrency(commits, async (commit) => {
    if (!commit.sha) throw new Error('GitHub commit has no SHA');
    try {
      return { commit, detail: await fetchRepositoryCommitDetail(repository, commit.sha) };
    } catch (error) {
      return { commit, detail: null, error };
    }
  }, concurrency);
  const rateLimitError = findGitHubRateLimitError(items);
  if (rateLimitError) throw rateLimitError;
  const hasMore = commits.length >= perPage;
  return {
    items,
    listedCommits: commits.length,
    hasMore,
    cursor: null,
    totalCommits: hasMore ? null : ((page - 1) * perPage) + commits.length,
    source: 'rest'
  };
}

async function fetchRepositoryCommitBatch(repository, window, limit = REPOSITORY_ANALYSIS_INITIAL_COMMITS) {
  const items = [];
  let cursor = null;
  let useGraphQL = true;
  let pagesFetched = 0;
  let truncated = false;
  let totalCommits = null;

  for (let page = 1; page <= REPOSITORY_ANALYSIS_MAX_HISTORY_PAGES; page += 1) {
    const result = await fetchRepositoryAnalysisPage(repository, window, { page, cursor, useGraphQL });
    pagesFetched = page;
    items.push(...result.items.slice(0, Math.max(0, limit - items.length)));
    // A REST page yields no GraphQL cursor, so the following pages stay on REST page numbers.
    useGraphQL = result.source === 'graphql';
    cursor = result.cursor;
    if (Number.isFinite(Number(result.totalCommits))) totalCommits = Number(result.totalCommits);
    if (!result.hasMore) break;
    if (items.length >= limit) {
      truncated = true;
      break;
    }
  }

  return { items, pagesFetched, truncated, cursor: useGraphQL ? cursor : null, totalCommits };
}

function createRepositoryContributor(identity, kind, profile = {}) {
  const contributorProfile = kind === 'human' ? profile : {};
  return {
    identity,
    kind,
    login: contributorProfile.login || null,
    name: contributorProfile.name || identity,
    avatarUrl: contributorProfile.avatarUrl || null,
    profileUrl: contributorProfile.profileUrl || null,
    commits: 0,
    additions: 0,
    deletions: 0,
    changedLines: 0,
    filesChanged: 0,
    lastCommit: null
  };
}

function updateRepositoryContributorEntry(entry, commitRecord) {
  entry.commits += 1;
  entry.additions += commitRecord.additions;
  entry.deletions += commitRecord.deletions;
  entry.changedLines += commitRecord.changedLines;
  entry.filesChanged += commitRecord.filesChanged;
  const entryCommitTime = Date.parse(commitRecord.date || '');
  const previousCommitTime = Date.parse(entry.lastCommit?.date || '');
  if (!entry.lastCommit || (Number.isFinite(entryCommitTime) && (!Number.isFinite(previousCommitTime) || entryCommitTime > previousCommitTime))) {
    entry.lastCommit = {
      sha: commitRecord.sha,
      shortSha: commitRecord.shortSha,
      url: commitRecord.url,
      message: commitRecord.message,
      date: commitRecord.date,
      additions: commitRecord.additions,
      deletions: commitRecord.deletions,
      changedLines: commitRecord.changedLines,
      filesChanged: commitRecord.filesChanged
    };
  }
  return entry;
}

function createRepositoryAnalysisTotals() {
  return {
    commits: 0,
    analyzedCommits: 0,
    skippedCommits: 0,
    additions: 0,
    deletions: 0,
    changedLines: 0,
    filesChanged: 0,
    aiCommits: 0,
    aiAdditions: 0,
    aiDeletions: 0,
    aiChangedLines: 0,
    aiFilesChanged: 0,
    humanCommits: 0,
    humanAdditions: 0,
    humanDeletions: 0,
    humanChangedLines: 0,
    humanFilesChanged: 0
  };
}

function getRepositoryAnalysisHumanKey(contributor) {
  return contributor?.login
    ? `login:${contributor.login}`
    : `name:${contributor?.identity || contributor?.name || 'Unknown contributor'}`;
}

function createRepositoryAnalysisState(analysis = null) {
  const summary = analysis?.summary || {};
  const totals = {
    ...createRepositoryAnalysisTotals(),
    ...summary,
    commits: Number(summary.commits ?? summary.listedCommits ?? 0),
    analyzedCommits: Number(summary.analyzedCommits || 0),
    skippedCommits: Number(summary.skippedCommits || 0),
    pagesFetched: Number(summary.pagesFetched || 0)
  };
  const agentMap = new Map();
  (Array.isArray(analysis?.agents) ? analysis.agents : []).forEach((agent) => {
    const key = agent.agentId || `label:${String(agent.identity || agent.agentLabel || '').trim().toLowerCase()}`;
    if (!key) return;
    agentMap.set(key, {
      ...agent,
      kind: 'ai',
      name: agent.agentLabel || agent.identity || 'AI agent',
      login: null,
      avatarUrl: null,
      profileUrl: null
    });
  });
  const contributorMap = new Map();
  const contributors = Array.isArray(analysis?.allContributors)
    ? analysis.allContributors
    : Array.isArray(analysis?.contributors) ? analysis.contributors : [];
  contributors.forEach((contributor) => {
    contributorMap.set(getRepositoryAnalysisHumanKey(contributor), { ...contributor });
  });
  return {
    totals,
    agentMap,
    contributorMap,
    contributorHeuristics: { ...(analysis?.contributorHeuristics || {}) },
    commitResults: Array.isArray(analysis?.commits) ? [...analysis.commits] : [],
    errors: Array.isArray(analysis?.errors) ? [...analysis.errors] : []
  };
}

function addRepositoryAnalysisCommit(state, item, agents, repository) {
  if (!item || item.error || !item.detail) {
    state.totals.skippedCommits += 1;
    if (item?.error) state.errors.push(item.error.message || String(item.error));
    return;
  }

  const stats = item.detail.stats || {};
  const additions = Math.max(0, Number(stats.additions) || 0);
  const deletions = Math.max(0, Number(stats.deletions) || 0);
  const changedLines = additions + deletions;
  const filesChanged = Array.isArray(item.detail.files) ? item.detail.files.length : 0;
  const directClassification = classifyRepositoryCommit(item.commit, item.detail, agents);
  const contributorHeuristic = getRepositoryContributorHeuristic(directClassification, state.contributorHeuristics);
  const classification = applyRepositoryContributorHeuristic(directClassification, state.contributorHeuristics);
  const identity = classification.kind === 'ai' ? classification.agentLabel : classification.contributor;
  const commitRecord = {
    sha: item.commit.sha,
    shortSha: item.commit.sha.slice(0, 7),
    url: item.detail.html_url || item.commit.html_url || `${repository.url}/commit/${item.commit.sha}`,
    message: String(item.detail.commit?.message || item.commit.commit?.message || '').split(/\r?\n/, 1)[0].slice(0, 180),
    date: item.detail.commit?.author?.date || item.commit.commit?.author?.date || null,
    kind: classification.kind,
    agent: classification.agentLabel,
    matchedBy: classification.matchedBy,
    inferredFrom: classification.inferredFrom?.login || null,
    contributor: identity,
    additions,
    deletions,
    changedLines,
    filesChanged
  };
  state.commitResults.push(commitRecord);
  state.totals.analyzedCommits += 1;
  state.totals.additions += additions;
  state.totals.deletions += deletions;
  state.totals.changedLines += changedLines;
  state.totals.filesChanged += filesChanged;

  if (classification.kind === 'human') {
    const key = classification.contributorLogin
      ? `login:${classification.contributorLogin}`
      : `name:${identity}`;
    const entry = state.contributorMap.get(key) || createRepositoryContributor(identity, 'human', classification.contributorProfile);
    applyRepositoryContributorProfileSignal(entry, contributorHeuristic, false);
    if (classification.contributorProfile) {
      entry.login ||= classification.contributorProfile.login;
      entry.name ||= classification.contributorProfile.name;
      entry.avatarUrl ||= classification.contributorProfile.avatarUrl;
      entry.profileUrl ||= classification.contributorProfile.profileUrl;
    }
    updateRepositoryContributorEntry(entry, commitRecord);
    state.contributorMap.set(key, entry);
  } else {
    const key = classification.agentId;
    const existing = !state.agentMap.has(key)
      ? [...state.agentMap.entries()].find(([, entry]) => entry.identity === classification.agentLabel || entry.agentLabel === classification.agentLabel)
      : null;
    const resolvedKey = existing?.[0] || key;
    const entry = state.agentMap.get(resolvedKey) || createRepositoryContributor(identity, 'ai');
    entry.agentId ||= classification.agentId;
    entry.agentLabel ||= classification.agentLabel;
    updateRepositoryContributorEntry(entry, commitRecord);
    state.agentMap.set(resolvedKey, entry);

    if (directClassification.kind === 'human' && directClassification.contributorLogin) {
      const contributorKey = `login:${directClassification.contributorLogin}`;
      const contributorEntry = state.contributorMap.get(contributorKey)
        || createRepositoryContributor(directClassification.contributor, 'human', directClassification.contributorProfile);
      applyRepositoryContributorProfileSignal(contributorEntry, contributorHeuristic, true);
      if (directClassification.contributorProfile) {
        contributorEntry.login ||= directClassification.contributorProfile.login;
        contributorEntry.name ||= directClassification.contributorProfile.name;
        contributorEntry.avatarUrl ||= directClassification.contributorProfile.avatarUrl;
        contributorEntry.profileUrl ||= directClassification.contributorProfile.profileUrl;
      }
      updateRepositoryContributorEntry(contributorEntry, commitRecord);
      state.contributorMap.set(contributorKey, contributorEntry);
    }
  }

  if (classification.kind === 'ai') {
    state.totals.aiCommits += 1;
    state.totals.aiAdditions += additions;
    state.totals.aiDeletions += deletions;
    state.totals.aiChangedLines += changedLines;
    state.totals.aiFilesChanged += filesChanged;
  } else {
    state.totals.humanCommits += 1;
    state.totals.humanAdditions += additions;
    state.totals.humanDeletions += deletions;
    state.totals.humanChangedLines += changedLines;
    state.totals.humanFilesChanged += filesChanged;
  }
}

function finalizeRepositoryAnalysisTotals(totals) {
  totals.aiChangedShare = totals.changedLines
    ? roundMetric((totals.aiChangedLines / totals.changedLines) * 100)
    : null;
  totals.aiAdditionsShare = totals.additions
    ? roundMetric((totals.aiAdditions / totals.additions) * 100)
    : null;
  totals.aiCommitShare = totals.analyzedCommits
    ? roundMetric((totals.aiCommits / totals.analyzedCommits) * 100)
    : null;
  return totals;
}

function buildRepositoryAnalysisSnapshot(base, state, continuation, status) {
  const totals = finalizeRepositoryAnalysisTotals({ ...state.totals });
  const pagesFetched = Number(continuation?.pagesFetched || totals.pagesFetched || 0);
  const isIncomplete = continuation?.status !== 'complete';
  const contributors = [...state.contributorMap.values()]
    .map((contributor) => ({ ...contributor, changedShare: totals.changedLines ? roundMetric((contributor.changedLines / totals.changedLines) * 100) : null }))
    .sort((left, right) => right.changedLines - left.changedLines);
  const agents = [...state.agentMap.values()]
    .map((agent) => ({ ...agent, changedShare: totals.changedLines ? roundMetric((agent.changedLines / totals.changedLines) * 100) : null }))
    .sort((left, right) => right.changedLines - left.changedLines);
  return {
    ...base,
    version: 1,
    analysisVersion: REPOSITORY_ANALYSIS_CLASSIFICATION_VERSION,
    status,
    fetchedAt: new Date().toISOString(),
    summary: {
      ...totals,
      listedCommits: totals.commits,
      totalHistoryCommits: Number.isFinite(Number(continuation?.totalCommits))
        ? Number(continuation.totalCommits)
        : Number.isFinite(Number(base?.summary?.totalHistoryCommits))
          ? Number(base.summary.totalHistoryCommits)
          : null,
      pagesFetched,
      truncated: isIncomplete,
      statsCoverage: totals.commits ? roundMetric((totals.analyzedCommits / totals.commits) * 100) : 0
    },
    agents,
    contributors: contributors.slice(0, 50),
    allContributors: contributors,
    contributorHeuristics: state.contributorHeuristics,
    commits: state.commitResults,
    errors: [...new Set(state.errors)].slice(0, 20),
    continuation
  };
}

async function collectRepositoryAnalysis(repository) {
  const repoPath = `${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
  const repoPayload = await fetchGitHubJson(`${GITHUB_API_URL}/repos/${repoPath}`);
  if (repoPayload.private) throw repositoryAnalysisError('Репозиторий приватный. Нужен публичный репозиторий GitHub.', 403);

  const normalizedRepository = {
    ...repository,
    url: repoPayload.html_url || repository.url,
    defaultBranch: repoPayload.default_branch || 'main',
    description: repoPayload.description || null,
    language: repoPayload.language || null,
    stars: Number(repoPayload.stargazers_count || 0),
    fork: Boolean(repoPayload.fork),
    pushedAt: repoPayload.pushed_at || null,
    license: repoPayload.license?.spdx_id || null
  };
  const window = getRepositoryHistoryWindow();
  const agentConfig = await readJsonFile(AI_AGENTS_FILE, { version: 1, agents: [] });
  const agents = Array.isArray(agentConfig.agents) ? agentConfig.agents : [];
  const listed = await fetchRepositoryCommitBatch(normalizedRepository, window);
  const detailed = listed.items;
  const contributorHeuristics = await inferRepositoryContributorAgents(
    detailed,
    agents,
    window,
    normalizedRepository.key
  );

  const totals = {
    commits: listed.items.length,
    analyzedCommits: 0,
    skippedCommits: 0,
    additions: 0,
    deletions: 0,
    changedLines: 0,
    filesChanged: 0,
    aiCommits: 0,
    aiAdditions: 0,
    aiDeletions: 0,
    aiChangedLines: 0,
    aiFilesChanged: 0,
    humanCommits: 0,
    humanAdditions: 0,
    humanDeletions: 0,
    humanChangedLines: 0,
    humanFilesChanged: 0
  };
  const agentMap = new Map();
  const contributorMap = new Map();
  const commitResults = [];
  const errors = [];

  for (const item of detailed) {
    if (!item || item.error || !item.detail) {
      totals.skippedCommits += 1;
      if (item?.error) errors.push(item.error.message || String(item.error));
      continue;
    }

    const stats = item.detail.stats || {};
    const additions = Math.max(0, Number(stats.additions) || 0);
    const deletions = Math.max(0, Number(stats.deletions) || 0);
    const changedLines = additions + deletions;
    const filesChanged = Array.isArray(item.detail.files) ? item.detail.files.length : 0;
    const directClassification = classifyRepositoryCommit(item.commit, item.detail, agents);
    const contributorHeuristic = getRepositoryContributorHeuristic(directClassification, contributorHeuristics);
    const classification = applyRepositoryContributorHeuristic(directClassification, contributorHeuristics);
    const identity = classification.kind === 'ai'
      ? classification.agentLabel
      : classification.contributor;
    const commitRecord = {
      sha: item.commit.sha,
      shortSha: item.commit.sha.slice(0, 7),
      url: item.detail.html_url || item.commit.html_url || `${repository.url}/commit/${item.commit.sha}`,
      message: String(item.detail.commit?.message || item.commit.commit?.message || '').split(/\r?\n/, 1)[0].slice(0, 180),
      date: item.detail.commit?.author?.date || item.commit.commit?.author?.date || null,
      kind: classification.kind,
      agent: classification.agentLabel,
      matchedBy: classification.matchedBy,
      inferredFrom: classification.inferredFrom?.login || null,
      contributor: identity,
      additions,
      deletions,
      changedLines,
      filesChanged
    };
    commitResults.push(commitRecord);
    totals.analyzedCommits += 1;
    totals.additions += additions;
    totals.deletions += deletions;
    totals.changedLines += changedLines;
    totals.filesChanged += filesChanged;

    if (classification.kind === 'human') {
      const key = classification.contributorLogin
        ? `login:${classification.contributorLogin}`
        : `name:${identity}`;
      const entry = contributorMap.get(key) || createRepositoryContributor(identity, 'human', classification.contributorProfile);
      applyRepositoryContributorProfileSignal(entry, contributorHeuristic, false);
      if (classification.contributorProfile) {
        entry.login ||= classification.contributorProfile.login;
        entry.name ||= classification.contributorProfile.name;
        entry.avatarUrl ||= classification.contributorProfile.avatarUrl;
        entry.profileUrl ||= classification.contributorProfile.profileUrl;
      }
      updateRepositoryContributorEntry(entry, commitRecord);
      contributorMap.set(key, entry);
    } else {
      const key = classification.agentId;
      const existing = !agentMap.has(key)
        ? [...agentMap.entries()].find(([, entry]) => entry.identity === classification.agentLabel || entry.agentLabel === classification.agentLabel)
        : null;
      const resolvedKey = existing?.[0] || key;
      const entry = agentMap.get(resolvedKey) || createRepositoryContributor(identity, 'ai');
      entry.agentId ||= classification.agentId;
      entry.agentLabel ||= classification.agentLabel;
      updateRepositoryContributorEntry(entry, commitRecord);
      agentMap.set(resolvedKey, entry);

      if (directClassification.kind === 'human' && directClassification.contributorLogin) {
        const contributorKey = `login:${directClassification.contributorLogin}`;
        const contributorEntry = contributorMap.get(contributorKey)
          || createRepositoryContributor(directClassification.contributor, 'human', directClassification.contributorProfile);
        applyRepositoryContributorProfileSignal(contributorEntry, contributorHeuristic, true);
        if (directClassification.contributorProfile) {
          contributorEntry.login ||= directClassification.contributorProfile.login;
          contributorEntry.name ||= directClassification.contributorProfile.name;
          contributorEntry.avatarUrl ||= directClassification.contributorProfile.avatarUrl;
          contributorEntry.profileUrl ||= directClassification.contributorProfile.profileUrl;
        }
        updateRepositoryContributorEntry(contributorEntry, commitRecord);
        contributorMap.set(contributorKey, contributorEntry);
      }
    }

    if (classification.kind === 'ai') {
      totals.aiCommits += 1;
      totals.aiAdditions += additions;
      totals.aiDeletions += deletions;
      totals.aiChangedLines += changedLines;
      totals.aiFilesChanged += filesChanged;
    } else {
      totals.humanCommits += 1;
      totals.humanAdditions += additions;
      totals.humanDeletions += deletions;
      totals.humanChangedLines += changedLines;
      totals.humanFilesChanged += filesChanged;
    }
  }

  totals.aiChangedShare = totals.changedLines
    ? roundMetric((totals.aiChangedLines / totals.changedLines) * 100)
    : null;
  totals.aiAdditionsShare = totals.additions
    ? roundMetric((totals.aiAdditions / totals.additions) * 100)
    : null;
  totals.aiCommitShare = totals.analyzedCommits
    ? roundMetric((totals.aiCommits / totals.analyzedCommits) * 100)
    : null;

  const initialContinuation = listed.truncated
    ? {
      status: 'running',
      nextPage: listed.pagesFetched + 1,
      cursor: listed.cursor,
      pagesFetched: listed.pagesFetched,
      processedCommits: listed.items.length,
      totalCommits: Number.isFinite(Number(listed.totalCommits)) ? Number(listed.totalCommits) : null
    }
    : {
      status: 'complete',
      nextPage: null,
      pagesFetched: listed.pagesFetched,
      processedCommits: listed.items.length,
      totalCommits: Number.isFinite(Number(listed.totalCommits)) ? Number(listed.totalCommits) : listed.items.length
    };

  return {
    version: 1,
    analysisVersion: REPOSITORY_ANALYSIS_CLASSIFICATION_VERSION,
    status: listed.truncated ? 'background' : totals.skippedCommits ? 'partial' : 'live',
    fetchedAt: new Date().toISOString(),
    source: GITHUB_API_URL,
    method: 'GitHub public commit history + per-commit stats',
    repository: normalizedRepository,
    window: {
      ...window,
      initialCommits: REPOSITORY_ANALYSIS_INITIAL_COMMITS,
      historyScope: 'all public commits'
    },
    summary: {
      ...totals,
      listedCommits: listed.items.length,
      totalHistoryCommits: Number.isFinite(Number(listed.totalCommits)) ? Number(listed.totalCommits) : null,
      pagesFetched: listed.pagesFetched,
      truncated: listed.truncated,
      statsCoverage: totals.commits ? roundMetric((totals.analyzedCommits / totals.commits) * 100) : 0
    },
    agents: [...agentMap.values()]
      .map((agent) => ({ ...agent, changedShare: totals.changedLines ? roundMetric((agent.changedLines / totals.changedLines) * 100) : null }))
      .sort((left, right) => right.changedLines - left.changedLines),
    allContributors: [...contributorMap.values()]
      .map((contributor) => ({ ...contributor, changedShare: totals.changedLines ? roundMetric((contributor.changedLines / totals.changedLines) * 100) : null }))
      .sort((left, right) => right.changedLines - left.changedLines),
    contributors: [...contributorMap.values()]
      .map((contributor) => ({ ...contributor, changedShare: totals.changedLines ? roundMetric((contributor.changedLines / totals.changedLines) * 100) : null }))
      .sort((left, right) => right.changedLines - left.changedLines)
      .slice(0, 50),
    contributorHeuristics,
    commits: commitResults,
    errors: [...new Set(errors)].slice(0, 20),
    notes: [
      `Analyzed the complete public commit history. The first response contains up to ${REPOSITORY_ANALYSIS_INITIAL_COMMITS} commits; remaining pages continue in the background.`,
      'AI attribution is based on public author/committer markers, Co-Authored-By trailers, known agent accounts, and matching emails; AI used through a human account without a public marker is not visible.',
      "A Co-Authored-By match assigns the whole commit exclusively to the detected agent; the human contributor does not receive that commit. GitHub exposes commit stats, not a line-level split between co-authors.",
      'Changed lines means additions plus deletions from GitHub commit stats. It is not the same as unique surviving lines in the final repository.',
      'Author-repository heuristic: for the largest human contributors with a public login, a bounded sample of their own public repositories is checked. If one directly identified AI agent accounts for more than 50% of sampled commits and changed lines, matching commits in this repository are attributed to that agent; the human row keeps its GitHub avatar with a small agent marker. This is an inference, not direct authorship proof.',
      'The first batch is returned immediately; when more pages exist, the remaining commit history is processed in the background.'
    ],
    continuation: initialContinuation
  };
}

let repositoryAnalysisJobs = new Map();
let repositoryAnalysisContinuationJobs = new Map();

async function restoreRepositoryAnalysisCacheEntry(repositoryKey, previousEntry) {
  const cache = await readRepositoryAnalysesCache({ version: 1, repositories: {} });
  cache.repositories = cache.repositories || {};
  if (previousEntry) {
    cache.repositories[repositoryKey] = previousEntry;
    await writeRepositoryAnalysesCache(cache);
    return;
  }
  delete cache.repositories[repositoryKey];
  await writeRepositoryAnalysesCache(cache);
  const collection = await getMongoRepositoryCollection();
  if (!collection) return;
  try {
    await collection.deleteOne({ repositoryKey });
  } catch (error) {
    console.warn(`Could not remove Mongo repository analysis ${repositoryKey}: ${error.message}`);
  }
}

async function saveRepositoryAnalysisSnapshot(repositoryKey, analysis) {
  const cache = await readRepositoryAnalysesCache({ version: 1, repositories: {} });
  cache.repositories = cache.repositories || {};
  cache.repositories[repositoryKey] = analysis;
  await writeRepositoryAnalysesCache(cache);
}

function getRepositoryAnalysisBackgroundDurationMs(initialAnalysis) {
  const requestedAt = Date.parse(initialAnalysis?.requestedAt || '');
  const initialDuration = getRepositoryAnalysisDurationMs(initialAnalysis);
  const elapsed = Number.isFinite(requestedAt) ? Date.now() - requestedAt : 0;
  return Math.max(Number.isFinite(initialDuration) ? initialDuration : 0, elapsed);
}

async function continueRepositoryAnalysis(repository, resumedAnalysis, lock = null) {
  // A continuation resumed after a rate limit must not carry that error into new snapshots.
  const initialAnalysis = { ...resumedAnalysis };
  delete initialAnalysis.error;
  const state = createRepositoryAnalysisState(initialAnalysis);
  const agentConfig = await readJsonFile(AI_AGENTS_FILE, { version: 1, agents: [] });
  const agents = Array.isArray(agentConfig.agents) ? agentConfig.agents : [];
  let page = Number(initialAnalysis.continuation?.nextPage || Number(initialAnalysis.summary?.pagesFetched || 3) + 1);
  // Analyses saved before the GraphQL source only have a REST page number and resume on REST.
  let cursor = initialAnalysis.continuation?.cursor || null;
  let pagesFetched = Number(initialAnalysis.summary?.pagesFetched || 0);
  let totalCommits = Number.isFinite(Number(initialAnalysis.continuation?.totalCommits))
    ? Number(initialAnalysis.continuation.totalCommits)
    : Number.isFinite(Number(initialAnalysis.summary?.totalHistoryCommits))
      ? Number(initialAnalysis.summary.totalHistoryCommits)
      : null;

  try {
    if (lock && !(await refreshRepositoryAnalysisLock(lock, 'background'))) {
      throw new Error('Repository analysis lock was lost before background processing started.');
    }
    while (true) {
      const result = await fetchRepositoryAnalysisPage(repository, initialAnalysis.window, { page, cursor, useGraphQL: Boolean(cursor) });
      if (!result.listedCommits) {
        const continuation = {
          status: 'complete',
          nextPage: null,
          pagesFetched,
          processedCommits: state.totals.commits,
          totalCommits: totalCommits ?? state.totals.commits
        };
        const completed = buildRepositoryAnalysisSnapshot(initialAnalysis, state, continuation, state.totals.skippedCommits ? 'partial' : 'live');
        completed.requestedAt = initialAnalysis.requestedAt;
        completed.lastAttemptAt = initialAnalysis.lastAttemptAt;
        completed.analysisDurationMs = getRepositoryAnalysisBackgroundDurationMs(initialAnalysis);
        completed.analysisDurationSeconds = roundMetric(completed.analysisDurationMs / 1000);
        completed.history = appendRepositoryAnalysisHistory(completed, initialAnalysis);
        await saveRepositoryAnalysisSnapshot(repository.key, completed);
        return completed;
      }

      state.totals.commits += result.listedCommits;
      pagesFetched = page;
      state.totals.pagesFetched = pagesFetched;
      if (Number.isFinite(Number(result.totalCommits))) totalCommits = Number(result.totalCommits);
      result.items.forEach((item) => addRepositoryAnalysisCommit(state, item, agents, repository));
      if (lock && !(await refreshRepositoryAnalysisLock(lock, 'background'))) {
        throw new Error('Repository analysis lock was lost during background processing.');
      }

      const hasMore = result.hasMore;
      cursor = result.source === 'graphql' ? result.cursor : null;
      const continuation = {
        status: hasMore ? 'running' : 'complete',
        nextPage: hasMore ? page + 1 : null,
        ...(hasMore && cursor ? { cursor } : {}),
        pagesFetched,
        processedCommits: state.totals.commits,
        totalCommits: totalCommits ?? (!hasMore ? state.totals.commits : null)
      };
      const snapshot = buildRepositoryAnalysisSnapshot(initialAnalysis, state, continuation, hasMore ? 'background' : state.totals.skippedCommits ? 'partial' : 'live');
      snapshot.requestedAt = initialAnalysis.requestedAt;
      snapshot.lastAttemptAt = initialAnalysis.lastAttemptAt;
      snapshot.analysisDurationMs = getRepositoryAnalysisBackgroundDurationMs(initialAnalysis);
      snapshot.analysisDurationSeconds = roundMetric(snapshot.analysisDurationMs / 1000);
      if (!hasMore) snapshot.history = appendRepositoryAnalysisHistory(snapshot, initialAnalysis);
      await saveRepositoryAnalysisSnapshot(repository.key, snapshot);
      if (!hasMore) return snapshot;
      page += 1;
    }
  } catch (error) {
    // A rate limit keeps the pages processed so far and records where to resume: the first
    // request after retryAt continues from the same page and cursor (see
    // getRepositoryAnalysis) instead of the partial snapshot standing for 24 hours.
    const rateLimit = isGitHubRateLimitError(error) ? toGitHubRateLimitHttpError(error) : null;
    const continuation = {
      status: 'error',
      nextPage: page,
      ...(cursor ? { cursor } : {}),
      pagesFetched,
      processedCommits: state.totals.commits,
      totalCommits,
      error: rateLimit ? rateLimit.message : error.message,
      ...(rateLimit
        ? { code: rateLimit.code, retryAt: rateLimit.retryAt || new Date(Date.now() + GITHUB_RATE_LIMIT_DEFAULT_RETRY_MS).toISOString() }
        : {})
    };
    const failed = buildRepositoryAnalysisSnapshot(initialAnalysis, state, continuation, 'partial');
    failed.requestedAt = initialAnalysis.requestedAt;
    failed.lastAttemptAt = new Date().toISOString();
    failed.analysisDurationMs = getRepositoryAnalysisBackgroundDurationMs(initialAnalysis);
    failed.analysisDurationSeconds = roundMetric(failed.analysisDurationMs / 1000);
    failed.error = continuation.error;
    await saveRepositoryAnalysisSnapshot(repository.key, failed);
    return failed;
  }
}

function startRepositoryAnalysisContinuation(repository, analysis, inheritedLock = null) {
  if (analysis?.continuation?.status !== 'running') return null;
  if (repositoryAnalysisContinuationJobs.has(repository.key)) return repositoryAnalysisContinuationJobs.get(repository.key);
  const continuationRepository = analysis?.repository?.defaultBranch
    ? analysis.repository
    : repository;
  const job = (async () => {
    let lock = inheritedLock;
    try {
      lock ||= await acquireRepositoryAnalysisLock(repository.key, 'background');
      if (!lock) return null;
      return await continueRepositoryAnalysis(continuationRepository, analysis, lock);
    } finally {
      if (lock) await releaseRepositoryAnalysisLock(lock);
    }
  })()
    .catch((error) => console.error(`Repository analysis continuation failed for ${repository.key}:`, error.message))
    .finally(() => repositoryAnalysisContinuationJobs.delete(repository.key));
  repositoryAnalysisContinuationJobs.set(repository.key, job);
  return job;
}

function repositoryAnalysisHistoryEntry(analysis) {
  const normalized = withRepositoryAnalysisDuration(analysis);
  return {
    fetchedAt: analysis?.fetchedAt || null,
    requestedAt: analysis?.requestedAt || null,
    analysisDurationMs: normalized.analysisDurationMs,
    analysisDurationSeconds: normalized.analysisDurationSeconds,
    status: analysis?.status || null,
    repository: analysis?.repository || null,
    window: analysis?.window || null,
    summary: analysis?.summary || null,
    agents: Array.isArray(analysis?.agents) ? analysis.agents : [],
    contributors: Array.isArray(analysis?.contributors) ? analysis.contributors : []
  };
}

function getRepositoryAnalysisHistory(analysis) {
  if (Array.isArray(analysis?.history) && analysis.history.length) {
    return analysis.history.map((entry) => repositoryAnalysisHistoryEntry(entry));
  }
  if (analysis?.summary && analysis?.fetchedAt) return [repositoryAnalysisHistoryEntry(analysis)];
  return [];
}

function appendRepositoryAnalysisHistory(analysis, previous) {
  const history = getRepositoryAnalysisHistory(previous || analysis);
  const entry = repositoryAnalysisHistoryEntry(analysis);
  const withoutDuplicate = history.filter((item) => item?.fetchedAt !== entry.fetchedAt);
  return [...withoutDuplicate, entry].slice(-REPOSITORY_ANALYSIS_HISTORY_LIMIT);
}

function getRepositoryAnalysisCacheInfo(analysis, hit = false) {
  const lastAttemptAt = Date.parse(analysis?.lastAttemptAt || analysis?.requestedAt || analysis?.fetchedAt || '');
  if (!Number.isFinite(lastAttemptAt)) return { hit, nextAnalysisAt: null, intervalHours: 24 };
  return {
    hit,
    fetchedAt: analysis?.fetchedAt || null,
    lastAttemptAt: new Date(lastAttemptAt).toISOString(),
    nextAnalysisAt: new Date(lastAttemptAt + REPOSITORY_ANALYSIS_CACHE_TTL_MS).toISOString(),
    intervalHours: 24
  };
}

async function migrateRepositoryAnalysisHistory() {
  const cache = await readRepositoryAnalysesCache({ version: 1, repositories: {} });
  cache.repositories = cache.repositories || {};
  let changed = false;
  for (const [key, analysis] of Object.entries(cache.repositories)) {
    const normalizedHistory = getRepositoryAnalysisHistory(analysis);
    const normalizedAnalysis = withRepositoryAnalysisDuration({ ...analysis, history: normalizedHistory });
    const historyNeedsMigration = normalizedHistory.some((entry, index) => {
      const current = Array.isArray(analysis?.history) ? analysis.history[index] : null;
      return current?.analysisDurationMs !== entry.analysisDurationMs
        || current?.analysisDurationSeconds !== entry.analysisDurationSeconds;
    });
    const topLevelNeedsMigration = analysis?.analysisDurationMs !== normalizedAnalysis.analysisDurationMs
      || analysis?.analysisDurationSeconds !== normalizedAnalysis.analysisDurationSeconds;
    if (historyNeedsMigration || topLevelNeedsMigration || (!Array.isArray(analysis?.history) && normalizedHistory.length)) {
      cache.repositories[key] = normalizedAnalysis;
      changed = true;
    }
  }
  if (changed) await writeRepositoryAnalysesCache(cache);
}

async function getRepositoryAnalysis({ input, refresh = true } = {}) {
  const repository = normalizePublicGithubRepository(input);
  if (repositoryAnalysisJobs.has(repository.key)) return repositoryAnalysisJobs.get(repository.key);
  const cache = await readRepositoryAnalysesCache({ version: 1, repositories: {} });
  cache.repositories = cache.repositories || {};
  const cached = cache.repositories[repository.key]
    ? withRepositoryAnalysisDuration({ ...cache.repositories[repository.key], history: getRepositoryAnalysisHistory(cache.repositories[repository.key]) })
    : null;
  const cachedAttemptAt = Date.parse(cached?.lastAttemptAt || cached?.requestedAt || cached?.fetchedAt || '');
  const cacheIsCompatible = Number(cached?.analysisVersion || 1) >= REPOSITORY_ANALYSIS_CLASSIFICATION_VERSION;
  if (cached?.summary && cacheIsCompatible && cached.continuation?.status === 'error' && cached.continuation.code === 'github-rate-limit') {
    const retryAt = Date.parse(cached.continuation.retryAt || '');
    if (Number.isFinite(retryAt) && retryAt > Date.now()) throw githubRateLimitHttpError(retryAt);
    const resumed = { ...cached, continuation: { ...cached.continuation, status: 'running' } };
    startRepositoryAnalysisContinuation(repository, resumed);
    return { ...resumed, status: 'background', cache: getRepositoryAnalysisCacheInfo(cached, true) };
  }
  if (cached?.summary && cacheIsCompatible && cached.continuation?.status === 'running') {
    startRepositoryAnalysisContinuation(repository, cached);
    return { ...cached, status: 'background', cache: getRepositoryAnalysisCacheInfo(cached, true) };
  }
  if (cached?.summary && cacheIsCompatible && Number.isFinite(cachedAttemptAt) && Date.now() - cachedAttemptAt < REPOSITORY_ANALYSIS_CACHE_TTL_MS) {
    if (!Array.isArray(cache.repositories[repository.key]?.history) && cached.history.length) {
      cache.repositories[repository.key] = { ...cache.repositories[repository.key], history: cached.history };
      await writeRepositoryAnalysesCache(cache);
    }
    return { ...cached, status: cached.status === 'stale-cache' ? 'stale-cache' : 'cached', cache: getRepositoryAnalysisCacheInfo(cached, true) };
  }
  // A new analysis needs both REST (repository, profiles) and GraphQL (history).
  const knownRateLimitReset = getGitHubRateLimitResetAt(['core', 'graphql']);
  if (knownRateLimitReset) throw githubRateLimitHttpError(knownRateLimitReset);
  const analysisLock = await acquireRepositoryAnalysisLock(repository.key, 'initial');
  if (!analysisLock) {
    const activeLock = await readRepositoryAnalysisLock(repository.key);
    const inProgressCache = await readRepositoryAnalysesCache({ version: 1, repositories: {} });
    const inProgress = inProgressCache.repositories?.[repository.key]
      ? withRepositoryAnalysisDuration({
        ...inProgressCache.repositories[repository.key],
        history: getRepositoryAnalysisHistory(inProgressCache.repositories[repository.key])
      })
      : null;
    if (inProgress?.summary) {
      if (inProgress.continuation?.status === 'running') startRepositoryAnalysisContinuation(repository, inProgress);
      return {
        ...inProgress,
        status: activeLock?.stage === 'initial'
          ? 'queued'
          : inProgress.continuation?.status === 'running' ? 'background' : inProgress.status || 'queued',
        cache: getRepositoryAnalysisCacheInfo(inProgress, true)
      };
    }
    return {
      ...(inProgress || {}),
      status: 'queued',
      repository: inProgress?.repository || repository,
      cache: getRepositoryAnalysisCacheInfo(inProgress || { requestedAt: new Date().toISOString() }, true)
    };
  }

  let analysisLockTransferred = false;
  const previousEntry = cache.repositories[repository.key] || null;

  const job = (async () => {
    const requestedAt = new Date().toISOString();
    cache.repositories[repository.key] = {
      ...(cached || {}),
      version: 1,
      analysisVersion: REPOSITORY_ANALYSIS_CLASSIFICATION_VERSION,
      status: 'queued',
      requestedAt,
      lastAttemptAt: requestedAt,
      repository
    };
    await writeRepositoryAnalysesCache(cache);
    const analysisStartedAt = Date.now();
    try {
      const result = await collectRepositoryAnalysis(repository);
      result.analysisDurationMs = Date.now() - analysisStartedAt;
      result.analysisDurationSeconds = roundMetric(result.analysisDurationMs / 1000);
      result.requestedAt = requestedAt;
      result.lastAttemptAt = requestedAt;
      result.history = appendRepositoryAnalysisHistory(result, cached);
      result.cache = getRepositoryAnalysisCacheInfo(result);
      const latest = await readRepositoryAnalysesCache({ version: 1, repositories: {} });
      latest.repositories = latest.repositories || {};
      latest.repositories[repository.key] = result;
      await writeRepositoryAnalysesCache(latest);
      analysisLockTransferred = Boolean(startRepositoryAnalysisContinuation(repository, result, analysisLock));
      return result;
    } catch (error) {
      // A rate limit says nothing about the repository: the previous entry is put back, so
      // neither a stale copy nor an 'unavailable' record is cached for the next 24 hours.
      if (isGitHubRateLimitError(error)) {
        await restoreRepositoryAnalysisCacheEntry(repository.key, previousEntry);
        throw toGitHubRateLimitHttpError(error);
      }
      if (cached?.summary) {
        const stale = {
          ...cached,
          status: 'stale-cache',
          requestedAt,
          lastAttemptAt: requestedAt,
        error: error.message,
        history: getRepositoryAnalysisHistory(cached),
        cache: getRepositoryAnalysisCacheInfo(cached, true)
        };
        cache.repositories[repository.key] = stale;
        await writeRepositoryAnalysesCache(cache);
        return stale;
      }
      const unavailableDurationMs = Date.now() - analysisStartedAt;
      const unavailable = {
        version: 1,
        analysisVersion: REPOSITORY_ANALYSIS_CLASSIFICATION_VERSION,
        status: 'unavailable',
        requestedAt,
        lastAttemptAt: requestedAt,
        analysisDurationMs: unavailableDurationMs,
        analysisDurationSeconds: roundMetric(unavailableDurationMs / 1000),
        fetchedAt: null,
        repository,
        source: GITHUB_API_URL,
        error: error.message,
        summary: null,
        agents: [],
        contributors: [],
        commits: [],
        history: [],
        notes: ['The repository analysis could not be completed.']
      };
      cache.repositories[repository.key] = unavailable;
      await writeRepositoryAnalysesCache(cache);
      return unavailable;
    } finally {
      repositoryAnalysisJobs.delete(repository.key);
      if (!analysisLockTransferred) await releaseRepositoryAnalysisLock(analysisLock);
    }
  })();
  repositoryAnalysisJobs.set(repository.key, job);
  return job;
}

const contributorAnalysisCache = new Map();
const contributorAnalysisJobs = new Map();

async function getContributorAnalysis({ input } = {}) {
  const login = normalizePublicGithubProfile(input);
  if (!login) throw repositoryAnalysisError('Нужна ссылка на профиль вида https://github.com/username.');
  const key = login.toLowerCase();
  const cached = contributorAnalysisCache.get(key);
  if (cached && Date.now() - cached.at < CONTRIBUTOR_ANALYSIS_CACHE_TTL_MS) {
    return { ...cached.value, cache: { hit: true, fetchedAt: cached.value.fetchedAt } };
  }
  if (contributorAnalysisJobs.has(key)) return contributorAnalysisJobs.get(key);
  const knownRateLimitReset = getGitHubRateLimitResetAt(['core', 'graphql']);
  if (knownRateLimitReset) throw githubRateLimitHttpError(knownRateLimitReset);
  const job = (async () => {
    const startedAt = Date.now();
    const agentConfig = await readJsonFile(AI_AGENTS_FILE, { version: 1, agents: [] });
    const agents = Array.isArray(agentConfig.agents) ? agentConfig.agents : [];
    const profile = await inferRepositoryContributorAgent(login, agents, getRepositoryHistoryWindow(), null, {
      maxRepositories: CONTRIBUTOR_ANALYSIS_MAX_REPOSITORIES
    });
    // A failed lookup is reported as an error and never cached, so the next attempt
    // reaches GitHub again instead of showing an empty profile for hours.
    if (profile?.status === 'unavailable') {
      const reason = String(profile.error || '');
      if (/404/.test(reason)) throw repositoryAnalysisError('Пользователь GitHub не найден.', 404);
      if (/rate limit/i.test(reason)) throw githubRateLimitHttpError(getGitHubRateLimitResetAt());
      throw repositoryAnalysisError('GitHub не ответил. Попробуйте позже.', 502);
    }
    const value = {
      version: 1,
      kind: 'contributor',
      status: profile?.status === 'unavailable' ? 'partial' : 'live',
      fetchedAt: new Date().toISOString(),
      analysisDurationMs: Date.now() - startedAt,
      login: profile?.login || login,
      profile: profile?.profile || null,
      result: profile,
      notes: [
        `Sample: up to ${CONTRIBUTOR_ANALYSIS_MAX_REPOSITORIES} of the user's own non-fork public repositories (latest push first), up to ${REPOSITORY_ANALYSIS_AUTHOR_HEURISTIC_MAX_COMMITS_PER_REPOSITORY} recent commits each.`,
        "Only the user's own commits count: their human commits, their commits with an agent co-author, and commits made by an agent account. AI used without a public marker is not visible."
      ]
    };
    contributorAnalysisCache.set(key, { at: Date.now(), value });
    return value;
  })().finally(() => contributorAnalysisJobs.delete(key));
  contributorAnalysisJobs.set(key, job);
  return job;
}

async function getRepositoryAnalyses() {
  const cache = await readRepositoryAnalysesCache({ version: 1, repositories: {} });
  const cachedAnalyses = Object.values(cache.repositories || {});
  const repositories = cachedAnalyses.map((analysis) => ({
    status: analysis.status,
    fetchedAt: analysis.fetchedAt || null,
    requestedAt: analysis.requestedAt || null,
    analysisDurationMs: getRepositoryAnalysisDurationMs(analysis),
    analysisDurationSeconds: Number.isFinite(getRepositoryAnalysisDurationMs(analysis))
      ? roundMetric(getRepositoryAnalysisDurationMs(analysis) / 1000)
      : null,
    repository: analysis.repository || null,
    summary: analysis.summary || null,
    history: getRepositoryAnalysisHistory(analysis),
    error: analysis.error || null
  }));
  const topRepositories = cachedAnalyses
    .map((analysis) => {
      const history = getRepositoryAnalysisHistory(analysis)
        .filter((entry) => entry?.summary && entry?.fetchedAt)
        .sort((left, right) => Date.parse(left.fetchedAt) - Date.parse(right.fetchedAt));
      const snapshot = history.at(-1) || null;
      const summary = snapshot?.summary || analysis.summary;
      const repository = snapshot?.repository || analysis.repository;
      const aiChangedLines = Number(summary?.aiChangedLines) || 0;
      const totalChangedLines = Number(summary?.changedLines) || 0;
      if (!summary || !repository || aiChangedLines <= 0 || totalChangedLines <= 0) return null;
      const sizeFactor = Math.min(1, totalChangedLines / REPOSITORY_ANALYSIS_LEADERBOARD_REFERENCE_LINES);
      const leaderboardScore = Math.round(aiChangedLines * sizeFactor);
      const agents = Array.isArray(snapshot?.agents) ? snapshot.agents : [];
      const topAgent = [...agents]
        .filter((agent) => Number(agent?.changedLines) > 0)
        .sort((left, right) => Number(right.changedLines) - Number(left.changedLines))[0] || null;
      return {
        repository: {
          fullName: repository.fullName || `${repository.owner || ''}/${repository.name || ''}`,
          url: repository.url || null
        },
        fetchedAt: snapshot?.fetchedAt || analysis.fetchedAt || null,
        analysisDurationMs: getRepositoryAnalysisDurationMs(snapshot || analysis),
        analysisDurationSeconds: Number.isFinite(getRepositoryAnalysisDurationMs(snapshot || analysis))
          ? roundMetric(getRepositoryAnalysisDurationMs(snapshot || analysis) / 1000)
          : null,
        status: snapshot?.status || analysis.status || null,
        aiChangedLines,
        totalChangedLines,
        leaderboardScore,
        leaderboardSizeFactor: roundMetric(sizeFactor * 100),
        aiChangedShare: Number.isFinite(Number(summary.aiChangedShare)) ? Number(summary.aiChangedShare) : null,
        aiCommits: Number(summary.aiCommits) || 0,
        analyzedCommits: Number(summary.analyzedCommits) || 0,
        topAgent: topAgent ? {
          identity: topAgent.identity || topAgent.name || topAgent.agentLabel || 'AI agent',
          changedLines: Number(topAgent.changedLines) || 0,
          changedShare: Number.isFinite(Number(topAgent.changedShare)) ? Number(topAgent.changedShare) : null
        } : null
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.leaderboardScore - left.leaderboardScore
      || right.aiChangedLines - left.aiChangedLines
      || right.totalChangedLines - left.totalChangedLines)
    .slice(0, 3);
  // The counterpart ranking: active repositories where people still write almost all
  // of the code. Ranked by lines changed by humans, so a large clean project beats a
  // tiny one with 0% AI.
  const activeSince = Date.now() - CLEAN_REPOSITORIES_ACTIVE_DAYS * 24 * 60 * 60 * 1000;
  const cleanRepositories = cachedAnalyses
    .map((analysis) => {
      const snapshot = getRepositoryAnalysisCodeSnapshot(analysis);
      const summary = snapshot?.summary;
      const repository = analysis.repository;
      const aiChangedShare = numeric(summary?.aiChangedShare);
      const pushedAt = Date.parse(repository?.pushedAt || '');
      if (!summary || !repository || repository.fork
        || aiChangedShare === null || aiChangedShare > CLEAN_REPOSITORIES_MAX_AI_SHARE
        || Number(summary.analyzedCommits || 0) < REPOSITORY_ANALYSES_CODE_MIN_COMMITS
        || !Number.isFinite(pushedAt) || pushedAt < activeSince) return null;
      const changedLines = Number(summary.changedLines) || 0;
      return {
        repository: {
          fullName: repository.fullName || `${repository.owner || ''}/${repository.name || ''}`,
          url: repository.url || null,
          language: repository.language || null,
          stars: Number(repository.stars) || 0,
          pushedAt: repository.pushedAt
        },
        fetchedAt: snapshot.fetchedAt || analysis.fetchedAt || null,
        changedLines,
        humanChangedLines: Number.isFinite(Number(summary.humanChangedLines))
          ? Number(summary.humanChangedLines)
          : Math.max(0, changedLines - (Number(summary.aiChangedLines) || 0)),
        aiChangedShare,
        humanChangedShare: roundMetric(100 - aiChangedShare),
        analyzedCommits: Number(summary.analyzedCommits) || 0,
        humanCommits: Number(summary.humanCommits) || 0
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.humanChangedLines - left.humanChangedLines)
    .slice(0, 3);
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    repositories,
    topRepositories,
    cleanRepositories,
    cleanRepositoriesCriteria: {
      maxAiShare: CLEAN_REPOSITORIES_MAX_AI_SHARE,
      activeDays: CLEAN_REPOSITORIES_ACTIVE_DAYS,
      minCommits: REPOSITORY_ANALYSES_CODE_MIN_COMMITS
    }
  };
}

async function getContributorProfiles() {
  const cache = await readContributorProfilesCache({ version: 1, profiles: {} });
  const profiles = Object.values(cache.profiles || {})
    .sort((left, right) => String(left.login || '').localeCompare(String(right.login || '')));
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    profiles
  };
}

async function collectGithubContributors() {
  const config = await readJsonFile(GITHUB_CONTRIBUTORS_FILE, { version: 1, windowDays: 365, contributors: [] });
  const window = getGithubWindow(config.windowDays);
  const contributors = [];
  for (const contributor of Array.isArray(config.contributors) ? config.contributors : []) {
    try {
      let result;
      if (getGithubApiToken()) {
        const graphql = await fetchGithubContributorGraphQL(contributor, window);
        let search = null;
        try {
          search = await fetchGithubContributorSearch(contributor, window);
        } catch (error) {
          search = { error: error.message, repositories: [], totalCommits: 0, reportedCommits: null, limited: true };
        }
        let pullRequestSearch = null;
        try {
          pullRequestSearch = await fetchGithubContributorPullRequests(contributor, window);
        } catch (error) {
          pullRequestSearch = { error: error.message, repositories: [], totalPullRequests: 0, reportedPullRequests: null, limited: true };
        }
        const exactRepositories = graphql.repositories || [];
        const searchRepositories = new Map();
        for (const repository of [...(search.repositories || []), ...(pullRequestSearch.repositories || [])]) {
          const existing = searchRepositories.get(repository.nameWithOwner) || repository;
          existing.commits = Math.max(existing.commits || 0, repository.commits || 0);
          existing.pullRequests = Math.max(existing.pullRequests || 0, repository.pullRequests || 0);
          searchRepositories.set(repository.nameWithOwner, existing);
        }
        const repositories = exactRepositories.length ? exactRepositories : [...searchRepositories.values()];
        result = {
          source: exactRepositories.length ? 'github-graphql' : 'github-graphql+search',
          evidence: exactRepositories.length ? 'contribution-graph' : 'commit-and-pr-search-lower-bound',
          limited: Boolean(graphql.limited || search.limited || pullRequestSearch.limited || !exactRepositories.length),
          totalCommits: exactRepositories.length ? graphql.totalCommits : search.totalCommits,
          reportedCommits: search.reportedCommits,
          totalPullRequests: exactRepositories.length ? graphql.totalPullRequests : pullRequestSearch.totalPullRequests,
          repositories,
          exact: {
            totalCommits: graphql.totalCommits,
            totalPullRequests: graphql.totalPullRequests,
            repositoryCount: exactRepositories.length,
            contributionRepositories: Number(graphql.totalRepositoriesWithContributedCommits || 0)
          },
          search: {
            query: search.query || null,
            totalCommits: search.totalCommits,
            reportedCommits: search.reportedCommits,
            repositoryCount: (search.repositories || []).length,
            pagesFetched: search.pagesFetched || 0,
            error: search.error || null
          },
          pullRequestSearch: {
            query: pullRequestSearch.query || null,
            totalPullRequests: pullRequestSearch.totalPullRequests,
            reportedPullRequests: pullRequestSearch.reportedPullRequests,
            repositoryCount: (pullRequestSearch.repositories || []).length,
            pagesFetched: pullRequestSearch.pagesFetched || 0,
            error: pullRequestSearch.error || null
          },
          note: exactRepositories.length
            ? 'GitHub contribution graph result for the selected period.'
            : 'The contribution graph is empty for this account; displayed projects are the union of public commit and Pull Request search lower bounds.'
        };
      } else {
        result = await fetchGithubContributorSearch(contributor, window);
      }
      contributors.push({
        ...contributor,
        ...result,
        repositoryCount: result.repositories.length
      });
    } catch (error) {
      contributors.push({
        ...contributor,
    source: getGithubApiToken() ? 'github-graphql' : 'github-search',
        status: 'error',
        repositoryCount: 0,
        totalCommits: 0,
        reportedCommits: 0,
        totalPullRequests: null,
        repositories: [],
        error: error.message
      });
    }
  }

  const projects = new Map();
  for (const contributor of contributors) {
    for (const repository of contributor.repositories || []) {
      const existing = projects.get(repository.nameWithOwner) || {
        ...repository,
        contributors: []
      };
      existing.commits += repository.commits || 0;
      existing.contributors.push(contributor.login);
      projects.set(repository.nameWithOwner, existing);
    }
  }

  return {
    version: 1,
    status: contributors.some((contributor) => contributor.status === 'error' || contributor.limited) ? 'partial' : 'live',
    source: GITHUB_API_URL,
    fetchedAt: new Date().toISOString(),
    window,
    auth: getGithubApiToken() ? 'github-token' : 'public-search',
    contributors,
    summary: {
      contributorCount: contributors.length,
      projectCount: projects.size,
      commitCount: contributors.reduce((sum, contributor) => sum + (Number(contributor.totalCommits) || 0), 0),
      reportedCommitCount: contributors.some((contributor) => contributor.limited || contributor.reportedCommits === null)
        ? null
        : contributors.reduce((sum, contributor) => sum + (Number(contributor.reportedCommits) || 0), 0),
      limited: contributors.some((contributor) => contributor.limited),
      projects: [...projects.values()].sort((left, right) => right.commits - left.commits)
    },
    note: getGithubApiToken()
      ? 'GitHub contribution graph is preferred; when it has no eligible repositories, public commit search is retained as a clearly marked lower-bound signal.'
      : 'Fallback uses public GitHub commit search. Configure a local GitHub token for a fuller GraphQL contribution history.'
  };
}

async function getGithubContributors({ refresh = false } = {}) {
  const cached = await readJsonFile(GITHUB_CONTRIBUTORS_CACHE_FILE, null);
  const cachedAt = Date.parse(cached?.fetchedAt || '');
  if (!refresh && cached && Number.isFinite(cachedAt) && Date.now() - cachedAt < GITHUB_CONTRIBUTORS_CACHE_TTL_MS) {
    return cached;
  }

  try {
    const fresh = await collectGithubContributors();
    await writeJsonFile(GITHUB_CONTRIBUTORS_CACHE_FILE, fresh);
    return fresh;
  } catch (error) {
    if (cached) return { ...cached, status: 'stale-cache', error: error.message };
    return {
      version: 1,
      status: 'unavailable',
      source: GITHUB_API_URL,
      fetchedAt: null,
      contributors: [],
      summary: { contributorCount: 0, projectCount: 0, commitCount: 0, limited: false, projects: [] },
      error: error.message,
      note: 'GitHub contributor data is unavailable and has not been cached yet.'
    };
  }
}

function sourceFreshnessStatus(timestamp) {
  const time = Date.parse(timestamp || '');
  if (!Number.isFinite(time)) return 'live';
  return Date.now() - time > STALE_SOURCE_AFTER_MS ? 'stale-source' : 'live';
}

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function median(values) {
  const sorted = values
    .map(Number)
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function createRadarObservation(raw) {
  const weightedValue = numeric(raw.global?.weighted_ai_percentage);
  const repositoryMedian = numeric(raw.global?.median_ai_percentage);
  if (weightedValue === null) throw new Error('AI Code Radar response has no weighted_ai_percentage');

  const coverage = raw.data_coverage || {};
  const quality = raw.quality || {};
  const computedAt = raw.computed_at || null;
  return {
    id: 'ai-code-radar',
    status: sourceFreshnessStatus(computedAt),
    metric: 'weighted-ai-percentage',
    value: clamp(Math.round(weightedValue * 10) / 10, 0, 100),
    repositoryMedian: repositoryMedian === null ? null : clamp(Math.round(repositoryMedian * 10) / 10, 0, 100),
    source: RADAR_API_URL,
    computedAt,
    fetchedAt: new Date().toISOString(),
    coverage: {
      attestations: numeric(coverage.total_attestations),
      repositories: numeric(coverage.unique_repos),
      commits: numeric(coverage.total_commits_covered),
      earliest: coverage.earliest_attestation || null,
      latest: coverage.latest_attestation || null,
      included: numeric(quality.included_in_aggregates) || numeric(coverage.unique_repos),
      excluded: numeric(quality.excluded_insufficient_data) || 0
    },
    quality: {
      confidence: quality.coverage_confidence || null,
      excludedOutliers: numeric(quality.excluded_outliers) || 0,
      excludedManipulation: numeric(quality.excluded_manipulation_flagged) || 0,
      excludedOptedOut: numeric(quality.excluded_opted_out) || 0
    },
    global: raw.global || {},
    byTool: raw.by_tool || [],
    byLanguage: raw.by_language || [],
    note: 'Explicit AI-attestation signal from a public open-source sample; it is not a line-by-line census of all software.'
  };
}

function createMeoOccupationObservation(raw) {
  const rows = Array.isArray(raw.rows) ? raw.rows : [];
  const usable = rows
    .map((row) => ({
      code: row.onet_soc_code || null,
      title: row.title || 'Untitled occupation',
      score: numeric(row.ai_exposure_score),
      employment: Math.max(0, numeric(row.employment_current) || 0),
      timeline: row.automation_timeline || null,
      type: row.automation_type || null
    }))
    .filter((row) => row.score !== null);
  const employmentTotal = usable.reduce((sum, row) => sum + row.employment, 0);
  const weightedTotal = usable.reduce((sum, row) => sum + (row.score * (row.employment || 1)), 0);
  const denominator = employmentTotal || usable.length;
  const value = denominator ? weightedTotal / denominator : null;
  if (value === null) throw new Error('Meo occupations response has no usable exposure scores');

  return {
    id: 'meo-workforce-data',
    status: sourceFreshnessStatus(raw.generated_at),
    metric: 'employment-weighted-occupation-exposure',
    value: clamp(Math.round(value * 10) / 10, 0, 100),
    source: MEO_OCCUPATIONS_URL,
    generatedAt: raw.generated_at || null,
    fetchedAt: new Date().toISOString(),
    coverage: {
      rows: numeric(raw.row_count) || usable.length,
      usableRows: usable.length,
      employmentCovered: employmentTotal,
      weightedBy: employmentTotal ? 'employment_current' : 'equal-occupation'
    },
    topExposed: [...usable]
      .sort((a, b) => b.score - a.score)
      .slice(0, 8),
    note: 'Employment-weighted occupational exposure, not observed AI adoption or proof of layoffs.'
  };
}

function weightedMedian(items) {
  const sorted = items
    .filter((item) => Number.isFinite(item.value) && Number.isFinite(item.weight) && item.weight > 0)
    .sort((left, right) => left.value - right.value);
  const total = sorted.reduce((sum, item) => sum + item.weight, 0);
  if (!total) return null;
  let running = 0;
  for (const item of sorted) {
    running += item.weight;
    if (running >= total / 2) return item.value;
  }
  return sorted.at(-1).value;
}

async function readWorkRatingRuns() {
  let files = [];
  try {
    files = (await fs.readdir(WORK_RATINGS_DIR)).filter((file) => file.endsWith('.json')).sort();
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn('Could not read Work rating runs:', error.message);
  }
  const runs = await Promise.all(files.map(async (file) => {
    const run = await readJsonFile(path.join(WORK_RATINGS_DIR, file), null);
    return run && run.ratings ? { file, ...run } : null;
  }));
  return runs.filter(Boolean);
}

// Occupation ratings over the unified ISCO-08 classifier: data/work/ holds the
// classifier, the ILOSTAT employment snapshot, and one file per rating run
// (refresh-work-occupations.js). The newest run that covers enough occupations
// is the current one; older runs form the history.
async function loadWorkOccupationData() {
  const [classifier, employment, runs] = await Promise.all([
    readJsonFile(WORK_CLASSIFIER_FILE, null),
    readJsonFile(WORK_EMPLOYMENT_FILE, null),
    readWorkRatingRuns()
  ]);
  const codes = Object.keys(classifier?.occupations || {});
  if (!codes.length) return null;

  const coverageOf = (run) => codes.filter((code) => Number.isInteger(run.ratings[code]?.score)).length / codes.length;
  const usableRuns = runs
    .filter((run) => coverageOf(run) >= WORK_OCCUPATIONS_MIN_COVERAGE)
    .sort((left, right) => Date.parse(right.checkedAt) - Date.parse(left.checkedAt) || (right.prompt?.version || 0) - (left.prompt?.version || 0));
  const currentRun = usableRuns[0] || null;

  // ILOSTAT counts people per sub-major group; ranking splits a group's count
  // evenly across its unit groups.
  const regions = employment?.regions || {};
  const unitsPerGroup = new Map();
  for (const code of codes) {
    const group = classifier.occupations[code].subMajor?.code || code.slice(0, 2);
    unitsPerGroup.set(group, (unitsPerGroup.get(group) || 0) + 1);
  }
  const groupEmployment = (group, regionIds = Object.keys(regions)) => regionIds
    .reduce((sum, id) => sum + (Number(regions[id]?.subMajorGroups?.[group]) || 0), 0);

  const occupations = codes
    .map((code) => {
      const occupation = classifier.occupations[code];
      const group = occupation.subMajor?.code || code.slice(0, 2);
      const rating = currentRun?.ratings?.[code];
      return {
        code,
        title: occupation.title,
        titleRu: occupation.titleRu || null,
        majorGroup: occupation.major || null,
        subMajorGroup: occupation.subMajor || null,
        employmentEstimate: Math.round(groupEmployment(group) / unitsPerGroup.get(group)),
        score: Number.isInteger(rating?.score) ? rating.score : null,
        rationale: rating?.rationale || null
      };
    })
    .sort((left, right) => right.employmentEstimate - left.employmentEstimate || left.code.localeCompare(right.code))
    .map((occupation, index) => ({ rank: index + 1, ...occupation }));

  return { classifier, employment, runs, usableRuns, currentRun, occupations, unitsPerGroup, groupEmployment };
}

// Employment-weighted view per region: each sub-major group carries the mean
// score of its unit groups and the region's employment in that group.
function summarizeWorkRegion(occupations, groupEmployment, regionIds) {
  const scoresByGroup = new Map();
  for (const occupation of occupations) {
    if (occupation.score === null) continue;
    const group = occupation.subMajorGroup?.code || occupation.code.slice(0, 2);
    if (!scoresByGroup.has(group)) scoresByGroup.set(group, []);
    scoresByGroup.get(group).push(occupation.score);
  }
  const items = [...scoresByGroup.entries()].map(([group, scores]) => ({
    value: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    weight: groupEmployment(group, regionIds)
  }));
  const weight = items.reduce((sum, item) => sum + item.weight, 0);
  return {
    employment: weight,
    weightedMean: weight ? roundMetric(items.reduce((sum, item) => sum + (item.value * item.weight), 0) / weight) : null,
    weightedMedian: roundMetric(weightedMedian(items))
  };
}

async function getWorkOccupationsObservation() {
  const data = await loadWorkOccupationData();
  if (!data?.currentRun) return null;
  const { currentRun, occupations, employment, groupEmployment, classifier } = data;
  const scores = occupations.map((occupation) => occupation.score).filter((score) => score !== null);
  const bucketEdges = [[0, 19], [20, 39], [40, 59], [60, 79], [80, 100]];
  const regions = employment?.regions || {};

  return {
    id: 'ai-countdown-occupation-ratings',
    status: sourceFreshnessStatus(currentRun.checkedAt),
    metric: 'median-ai-capability-rating-by-occupation',
    value: roundMetric(median(scores)),
    comparable: true,
    source: '/occupations.html',
    computedAt: currentRun.checkedAt,
    run: {
      file: `data/work/ratings/${currentRun.file}`,
      checkedDate: currentRun.checkedDate,
      checkedAt: currentRun.checkedAt,
      model: currentRun.model,
      provider: currentRun.provider || null,
      promptVersion: currentRun.prompt?.version ?? null,
      promptSha256: currentRun.prompt?.sha256 || null,
      classifierSha256: currentRun.inputs?.classifier?.sha256 || null,
      // Runs before prompt v2 assumed software-only AI and carry no assumptions block.
      embodiment: currentRun.assumptions?.embodiment || ['software']
    },
    scale: currentRun.scale || null,
    classification: classifier.classification || 'ISCO-08',
    coverage: {
      occupations: occupations.length,
      scored: scores.length,
      share: roundMetric((scores.length / occupations.length) * 100),
      minimumShare: WORK_OCCUPATIONS_MIN_COVERAGE * 100
    },
    regions: Object.fromEntries([
      ['all', { label: 'All covered countries', ...summarizeWorkRegion(occupations, groupEmployment) }],
      ...Object.entries(regions).map(([id, region]) => [id, {
        label: region.label,
        countries: (region.countries || []).length,
        ...summarizeWorkRegion(occupations, groupEmployment, [id])
      }])
    ]),
    distribution: bucketEdges.map(([from, to]) => ({
      from,
      to,
      occupations: scores.filter((score) => score >= from && score <= to).length
    })),
    history: data.usableRuns
      .map((run) => {
        const runScores = occupations.map((occupation) => run.ratings[occupation.code]?.score).filter(Number.isInteger);
        return { checkedDate: run.checkedDate, model: run.model, promptVersion: run.prompt?.version ?? null, value: roundMetric(median(runScores)), file: `data/work/ratings/${run.file}` };
      })
      .reverse(),
    note: 'Median AI capability rating across ISCO-08 occupations, one vote per occupation. A model judgement of what AI can do, not observed adoption.'
  };
}

function createWorkBaselineObservation() {
  return {
    id: 'ai-countdown-work-baseline',
    status: 'illustrative',
    metric: 'prototype-work-estimate',
    value: DASHBOARD_METRICS.workBaseline,
    comparable: true,
    source: '/methodology.html',
    note: 'The prototype Work estimate, kept as one Work source.'
  };
}

// Work = median of compatible Work percentages, the same rule as Code.
function buildWorkIndex(occupationRatings) {
  const baseline = createWorkBaselineObservation();
  const candidates = [baseline, occupationRatings].filter(Boolean);
  const used = candidates.filter((observation) => observation.comparable && Number.isFinite(Number(observation.value)));
  const value = roundMetric(median(used.map((observation) => observation.value)));
  return {
    value,
    unit: 'percent',
    aggregation: 'median-compatible-percentages',
    status: used.some((observation) => observation.id !== baseline.id) ? 'partial' : 'illustrative',
    sourcesUsed: used.map((observation) => observation.id),
    sourcesExcluded: [
      ...candidates.filter((observation) => !used.includes(observation)).map((observation) => observation.id),
      'meo-workforce-data'
    ],
    sourceValues: used.map((observation) => ({ id: observation.id, value: observation.value, status: observation.status })),
    note: 'Work is the median of the prototype estimate and the occupation ratings. Meo exposure scores stay a separate observation with their own scale.'
  };
}

async function getWorkIndex() {
  const occupationRatings = await getWorkOccupationsObservation();
  return {
    version: 1,
    fetchedAt: new Date().toISOString(),
    ...buildWorkIndex(occupationRatings),
    occupationRatings
  };
}

async function getWorkOccupations() {
  const [data, summary] = await Promise.all([loadWorkOccupationData(), getWorkOccupationsObservation()]);
  if (!data) return { version: 2, status: 'unavailable', summary: null, occupations: [] };
  const regions = data.employment?.regions || {};
  return {
    version: 2,
    status: summary ? summary.status : 'unscored',
    classification: data.classifier.classification || 'ISCO-08',
    classifierSource: data.classifier.source || null,
    titleRuSource: data.classifier.titleRuSource || null,
    employmentSource: data.employment ? {
      source: data.employment.source,
      indicator: data.employment.indicator,
      fetchedAt: data.employment.fetchedAt,
      regions: Object.fromEntries(Object.entries(regions).map(([id, region]) => [id, {
        label: region.label,
        employment: region.employment,
        countries: (region.countries || []).map((country) => `${country.code} ${country.year}`),
        missingCountries: region.missingCountries || []
      }]))
    } : null,
    prompt: data.currentRun?.prompt || null,
    request: data.currentRun?.request || null,
    summary,
    occupations: data.occupations
  };
}

function createBotCommitsObservation(raw) {
  const labels = Array.isArray(raw.labels) ? raw.labels : [];
  const values = Array.isArray(raw.claude) ? raw.claude : [];
  const lastFullIndex = Number.isInteger(Number(raw.last_full_idx))
    ? Number(raw.last_full_idx)
    : values.reduce((last, value, index) => Number.isFinite(Number(value)) ? index : last, -1);
  const value = Number(values[lastFullIndex]);
  if (!labels[lastFullIndex] || !Number.isFinite(value)) throw new Error('Bot Commits response has no Claude series');

  return {
    id: 'botcommits',
    status: sourceFreshnessStatus(raw.updated),
    metric: 'public-claude-commits-per-month',
    value,
    source: BOTCOMMITS_DATA_URL,
    updatedAt: raw.updated || null,
    fetchedAt: new Date().toISOString(),
    period: labels[lastFullIndex],
    coverage: {
      source: Array.isArray(raw.source) ? raw.source[lastFullIndex] || null : null,
      partial: Array.isArray(raw.partial) ? Boolean(raw.partial[lastFullIndex]) : null,
      cumulativeClaude: numeric(raw.headline?.cumulative_claude)
    },
    series: labels.map((period, index) => ({
      period,
      value: numeric(values[index]),
      source: Array.isArray(raw.source) ? raw.source[index] || null : null,
      partial: Array.isArray(raw.partial) ? Boolean(raw.partial[index]) : null
    })),
    note: 'Publicly attributable Claude Code commits by month; this is an activity count, not a count of unique repositories or all AI-written code.'
  };
}

async function refreshSourceFeeds() {
  const previous = await readJsonFile(SOURCE_FEEDS_CACHE_FILE, { version: 1, feeds: {} });
  const feeds = { ...(previous.feeds || {}) };
  const now = new Date().toISOString();
  const loaders = [
    ['ai-code-radar', () => fetchJson(RADAR_API_URL).then(createRadarObservation)],
    ['meo-workforce-data', () => fetchJson(MEO_OCCUPATIONS_URL).then(createMeoOccupationObservation)],
    ['botcommits', () => fetchJson(BOTCOMMITS_DATA_URL).then(createBotCommitsObservation)]
  ];

  await Promise.all(loaders.map(async ([id, loader]) => {
    try {
      feeds[id] = await loader();
    } catch (error) {
      if (feeds[id]) {
        feeds[id] = { ...feeds[id], status: 'stale-cache', failedAt: now, error: error.message };
      } else {
        feeds[id] = { id, status: 'unavailable', failedAt: now, error: error.message };
      }
    }
  }));

  const snapshot = { version: 1, fetchedAt: now, feeds };
  await writeJsonFile(SOURCE_FEEDS_CACHE_FILE, snapshot);
  return snapshot;
}

async function getSourceFeeds({ refresh = false } = {}) {
  const cached = await readJsonFile(SOURCE_FEEDS_CACHE_FILE, { version: 1, feeds: {} });
  if (!refresh && Object.keys(cached.feeds || {}).length) return cached;
  return refreshSourceFeeds();
}

async function fetchRepositoryCatalog() {
  const html = await fetchText(CATALOG_URL);
  const catalog = parseRepositoryCatalog(html);
  if (!catalog.entries.length) throw new Error('The public repository catalog returned no repository links');
  return catalog;
}

function getRecordWeight(record) {
  // The source currently does not publish a reliable line-count field.
  // Keep the aggregator ready for code-volume weighting and use one vote per
  // repository until that field is available.
  const candidate = Number(record.codeVolume ?? record.lineCount ?? record.weight);
  return Number.isFinite(candidate) && candidate > 0 ? candidate : 1;
}

function aggregateCodeIndex(records, catalogTotal, status = 'live', error = null) {
  const usable = records.filter((record) => Number.isFinite(Number(record.codeIndex)));
  const totalWeight = usable.reduce((sum, record) => sum + getRecordWeight(record), 0);
  const weightedSignal = totalWeight
    ? usable.reduce((sum, record) => sum + (Number(record.codeIndex) * getRecordWeight(record)), 0) / totalWeight
    : null;
  const included = usable.length;
  const hasCatalogTotal = Number.isFinite(catalogTotal) && catalogTotal > 0;
  const discovered = hasCatalogTotal ? catalogTotal : included;

  return {
    status,
    codeIndex: weightedSignal === null ? null : Math.round(weightedSignal * 10) / 10,
    source: CATALOG_URL,
    weighting: 'equal-repository',
    coverage: {
      catalogTotal: hasCatalogTotal ? catalogTotal : null,
      discovered,
      included,
      percent: discovered ? Math.round((included / discovered) * 1000) / 10 : 0
    },
    updatedAt: new Date().toISOString(),
    error,
    note: 'The score is an aggregate of repository signals, not a literal line-by-line authorship percentage.'
  };
}

async function getBootstrapCodeIndex() {
  const cache = await readCache();
  const records = Object.values(cache.entries || {});
  const snapshot = aggregateCodeIndex(records, null, records.length ? 'bootstrap' : 'unavailable');
  snapshot.note = records.length
    ? 'Bootstrap snapshot from the legacy local cache. Refresh the repository catalog to get the multi-repository index.'
    : 'No repository aggregate is cached yet.';
  return snapshot;
}

async function getCachedCodeIndex() {
  const cached = await readJsonFile(CODE_INDEX_CACHE_FILE, null);
  if (!cached || !Number.isFinite(Number(cached.codeIndex))) return null;
  if (cached.complete === true) return cached;

  // Older workers did not write `complete` into the final snapshot. Accept
  // that file only when the persisted run proves the whole catalog finished.
  const progress = await readJsonFile(CODE_INDEX_PROGRESS_FILE, null);
  const completedCatalog = progress?.status === 'complete'
    && Number(progress.processed) === Number(progress.catalogEntries)
    && Number(cached.coverage?.included) === Number(cached.coverage?.discovered);
  return completedCatalog ? { ...cached, complete: true } : null;
}

// Snapshot used for the "our repositories" Code source: the newest finished state of each
// analysis. A running continuation only covers the most recent commits, so its last
// completed history entry is used instead.
function getRepositoryAnalysisCodeSnapshot(analysis) {
  if (!analysis?.summary) return null;
  if (analysis.continuation?.status !== 'running') {
    return { summary: analysis.summary, fetchedAt: analysis.fetchedAt || null };
  }
  const history = (Array.isArray(analysis.history) ? analysis.history : [])
    .filter((entry) => entry?.summary && entry?.fetchedAt && entry.status !== 'background')
    .sort((left, right) => Date.parse(left.fetchedAt) - Date.parse(right.fetchedAt));
  const latest = history.at(-1);
  return latest ? { summary: latest.summary, fetchedAt: latest.fetchedAt } : null;
}

async function readRepositoryAnalysesForCodeIndex() {
  const collection = await getMongoRepositoryCollection();
  if (collection) {
    try {
      // Commit lists make full documents heavy; the index needs only the summaries.
      const documents = await collection.find({}, {
        projection: {
          _id: 0,
          repositoryKey: 1,
          'analysis.status': 1,
          'analysis.fetchedAt': 1,
          'analysis.analysisVersion': 1,
          'analysis.repository.fork': 1,
          'analysis.summary': 1,
          'analysis.continuation.status': 1,
          'analysis.history.status': 1,
          'analysis.history.fetchedAt': 1,
          'analysis.history.summary': 1
        }
      }).toArray();
      if (documents.length) {
        return documents
          .filter((document) => document.repositoryKey && document.analysis)
          .map((document) => [document.repositoryKey, document.analysis]);
      }
    } catch (error) {
      console.warn(`Could not read Mongo repository analyses for Code: ${error.message}`);
    }
  }
  const fileCache = await readJsonFile(REPOSITORY_ANALYSES_FILE, { version: 1, repositories: {} });
  return Object.entries(fileCache.repositories || {});
}

function createRepositoryAnalysesCodeObservation(entries) {
  const rows = [];
  let excluded = 0;
  for (const [repositoryKey, analysis] of entries) {
    const snapshot = getRepositoryAnalysisCodeSnapshot(analysis);
    const summary = snapshot?.summary;
    const share = numeric(summary?.aiChangedShare);
    const analyzedCommits = Number(summary?.analyzedCommits || 0);
    if (analysis?.repository?.fork
      || share === null
      || !(Number(summary?.changedLines) > 0)
      || analyzedCommits < REPOSITORY_ANALYSES_CODE_MIN_COMMITS) {
      excluded += 1;
      continue;
    }
    rows.push({
      repositoryKey,
      share,
      aiChangedLines: Number(summary.aiChangedLines || 0),
      changedLines: Number(summary.changedLines || 0),
      analyzedCommits,
      fetchedAt: snapshot.fetchedAt
    });
  }
  if (!rows.length) return null;

  const mean = rows.reduce((sum, row) => sum + row.share, 0) / rows.length;
  const totalChangedLines = rows.reduce((sum, row) => sum + row.changedLines, 0);
  const lineWeighted = totalChangedLines
    ? (rows.reduce((sum, row) => sum + row.aiChangedLines, 0) / totalChangedLines) * 100
    : null;
  const latest = rows
    .map((row) => row.fetchedAt)
    .filter(Boolean)
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0] || null;
  return {
    id: 'ai-countdown-repository-analyses',
    status: 'live',
    metric: 'mean-repository-ai-changed-lines-share',
    value: roundMetric(clamp(mean, 0, 100)),
    repositoryMedian: roundMetric(median(rows.map((row) => row.share))),
    lineWeighted: roundMetric(lineWeighted),
    source: '/api/repository-analyses',
    computedAt: latest,
    fetchedAt: new Date().toISOString(),
    coverage: {
      repositories: rows.length,
      excluded,
      commits: rows.reduce((sum, row) => sum + row.analyzedCommits, 0),
      changedLines: totalChangedLines,
      minCommits: REPOSITORY_ANALYSES_CODE_MIN_COMMITS
    },
    note: 'AI Countdown research: mean share of changed lines attributed to AI agents across public GitHub repositories analyzed by the site (one vote per repository). Repositories are chosen by visitors, so the sample is not random.'
  };
}

async function getRepositoryAnalysesCodeObservation() {
  if (repositoryAnalysesCodeObservationCache
    && Date.now() - repositoryAnalysesCodeObservationCache.at < REPOSITORY_ANALYSES_CODE_CACHE_TTL_MS) {
    return repositoryAnalysesCodeObservationCache.value;
  }
  let value = null;
  try {
    value = createRepositoryAnalysesCodeObservation(await readRepositoryAnalysesForCodeIndex());
  } catch (error) {
    console.warn(`Could not aggregate repository analyses for Code: ${error.message}`);
  }
  repositoryAnalysesCodeObservationCache = { at: Date.now(), value };
  return value;
}

function radarAsCodeIndex(observation, repositoryObservation = null) {
  const repositories = numeric(observation.coverage?.repositories);
  const included = numeric(observation.coverage?.included);
  const discovered = repositories || included || 0;
  const sourceValues = [
    {
      id: observation.id,
      label: 'AI Code Radar',
      value: observation.value,
      metric: 'weighted-ai-percentage',
      source: observation.source
    }
  ];
  if (Number.isFinite(Number(repositoryObservation?.value))) {
    sourceValues.push({
      id: repositoryObservation.id,
      label: 'AI Countdown repositories',
      value: repositoryObservation.value,
      metric: repositoryObservation.metric,
      source: repositoryObservation.source,
      repositories: repositoryObservation.coverage.repositories,
      repositoryMedian: repositoryObservation.repositoryMedian,
      lineWeighted: repositoryObservation.lineWeighted
    });
  }
  const codeIndex = roundMetric(median(sourceValues.map((source) => source.value)));
  return {
    status: observation.status,
    codeIndex,
    aggregation: 'median-compatible-sources',
    sourceValues,
    weightedCodeIndex: observation.value,
    repositoryMedianCodeIndex: observation.repositoryMedian ?? numeric(observation.global?.median_ai_percentage),
    source: observation.source,
    sourceId: observation.id,
    sourceLabel: sourceValues.length > 1 ? 'AI Code Radar + AI Countdown · median sources' : 'AI Code Radar · median sources',
    weighting: 'median-compatible-sources',
    coverage: {
      catalogTotal: repositories,
      discovered,
      included,
      percent: discovered && included ? Math.round((included / discovered) * 1000) / 10 : 0
    },
    updatedAt: observation.computedAt || observation.generatedAt || observation.fetchedAt,
    fetchedAt: observation.fetchedAt,
    quality: observation.quality,
    note: `${observation.note} Current Code is the median of compatible source values (AI Code Radar and, when available, the mean AI share across repositories analyzed by AI Countdown); the source's repository median is retained separately for context.`
  };
}

async function mapWithConcurrency(items, worker, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        results[index] = { error };
      }
    }
  });
  await Promise.all(runners);
  return results;
}

let refreshingCodeIndex = null;
let codeIndexWorkerProcess = null;
let codeIndexWorkerRestartTimer = null;

function launchCodeIndexWorker({ force = false } = {}) {
  if (codeIndexWorkerProcess && codeIndexWorkerProcess.exitCode === null) {
    return { started: false, status: 'running' };
  }

  if (codeIndexWorkerRestartTimer) {
    clearTimeout(codeIndexWorkerRestartTimer);
    codeIndexWorkerRestartTimer = null;
  }

  const args = [CODE_INDEX_WORKER_FILE];
  if (force) args.push('--force');
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();
  codeIndexWorkerProcess = child;
  child.once('error', (error) => {
    console.error('Code-index worker error:', error.message);
  });
  child.once('exit', (code, signal) => {
    if (codeIndexWorkerProcess !== child) return;
    codeIndexWorkerProcess = null;

    if (code === 0) return;

    console.error(`Code-index worker stopped unexpectedly (${code ?? signal ?? 'unknown'}); resuming from checkpoint.`);
    codeIndexWorkerRestartTimer = setTimeout(async () => {
      codeIndexWorkerRestartTimer = null;
      const progress = await getCodeIndexProgress();
      if (progress.status !== 'complete') launchCodeIndexWorker();
    }, 2000);
  });
  return { started: true, status: 'started' };
}

async function getCodeIndexProgress() {
  return readJsonFile(CODE_INDEX_PROGRESS_FILE, {
    status: 'idle',
    processed: 0,
    catalogEntries: 0,
    included: 0
  });
}

async function ensureBackgroundCodeIndexRefresh({ force = false } = {}) {
  const progress = await getCodeIndexProgress();
  if (force || progress.status !== 'complete') launchCodeIndexWorker({ force });
  return progress;
}

async function refreshCodeIndex() {
  if (refreshingCodeIndex) return refreshingCodeIndex;

  refreshingCodeIndex = (async () => {
    const catalog = await fetchRepositoryCatalog();
    const cache = await readCache();
    const now = Date.now();
    const results = await mapWithConcurrency(catalog.entries, async ({ repo, branch }) => {
      const key = cacheKey(repo, branch);
      const cached = cache.entries[key];
      const cachedAt = cached?.fetchedAt ? Date.parse(cached.fetchedAt) : 0;
      if (cached && Number.isFinite(cachedAt) && now - cachedAt < RECORD_CACHE_TTL_MS) return cached;

      try {
        const fresh = await fetchSlopScore(repo, branch);
        cache.entries[key] = fresh;
        return fresh;
      } catch (error) {
        if (cached) return { ...cached, status: 'stale-cache', error: error.message };
        return null;
      }
    }, FETCH_CONCURRENCY);

    await writeCache(cache);
    const records = results.filter((record) => record && record.status !== 'baseline');
    const snapshot = aggregateCodeIndex(records, catalog.catalogTotal, 'live');
    snapshot.catalogEntries = catalog.entries.length;
    snapshot.note = catalog.entries.length < (catalog.catalogTotal || catalog.entries.length)
      ? 'The source catalog exposes a partial page to the backend; coverage is shown explicitly until pagination is added.'
      : 'The aggregate currently uses one equal-weight vote per scanned repository; code-volume weighting is the next refinement.';
    await writeJsonFile(CODE_INDEX_CACHE_FILE, snapshot);
    return snapshot;
  })();

  try {
    return await refreshingCodeIndex;
  } finally {
    refreshingCodeIndex = null;
  }
}

async function getCodeIndex({ refresh = false } = {}) {
  const feeds = await getSourceFeeds();
  const radar = feeds.feeds?.['ai-code-radar'];
  if (!refresh) {
    if (radar && Number.isFinite(Number(radar.value))) return radarAsCodeIndex(radar, await getRepositoryAnalysesCodeObservation());
    const cached = await getCachedCodeIndex();
    if (cached) {
      return {
        ...cached,
        sourceLabel: 'Slop Score · auxiliary heuristic',
        weighting: 'median-repository-heuristic',
        status: cached.status === 'live' ? 'auxiliary' : cached.status,
        note: `${cached.note || ''} Slop Score is kept as an auxiliary heuristic because its score is not directly comparable with AI Code Radar's AI-attestation percentage.`.trim()
      };
    }
    return getBootstrapCodeIndex();
  }

  const progress = await ensureBackgroundCodeIndexRefresh({ force: true });
  const current = await getCodeIndex({ refresh: false });
  return {
    ...current,
    refresh: {
      status: 'started',
      progress
    }
  };
}

async function getSources() {
  const registry = await readJsonFile(SOURCES_FILE, { version: 1, sources: [] });
  const feedCache = await readJsonFile(SOURCE_FEEDS_CACHE_FILE, { version: 1, feeds: {} });
  const contributorCache = await readJsonFile(GITHUB_CONTRIBUTORS_CACHE_FILE, null);
  const feedStatus = Object.fromEntries(Object.entries(feedCache.feeds || {}).map(([id, feed]) => [id, {
    status: feed.status,
    value: feed.value ?? null,
    metric: feed.metric ?? null,
    computedAt: feed.computedAt || feed.generatedAt || null,
    fetchedAt: feed.fetchedAt || null,
    error: feed.error || null
  }]));
  if (contributorCache) {
    feedStatus['github-ai-contributors'] = {
      status: contributorCache.status,
      value: contributorCache.summary?.projectCount ?? null,
      metric: 'public-repositories-with-ai-linked-contributions',
      computedAt: contributorCache.fetchedAt || null,
      fetchedAt: contributorCache.fetchedAt || null,
      error: contributorCache.error || null
    };
  }
  return {
    status: 'live',
    updatedAt: new Date().toISOString(),
    sources: registry.sources || [],
    feeds: feedStatus
  };
}

function createCombinedObservation({
  id,
  category,
  metric,
  value,
  unit,
  status,
  source,
  observedAt,
  coverage,
  comparable = false,
  lowerBound = false,
  note,
  extra = {}
}) {
  return {
    id,
    category,
    metric,
    value: value === undefined ? null : value,
    unit,
    status,
    source,
    observedAt: observedAt || null,
    coverage: coverage || null,
    comparable,
    lowerBound,
    note,
    ...extra
  };
}

function combinedStatus(statuses) {
  const usable = statuses.filter(Boolean);
  if (!usable.length) return 'unavailable';
  if (usable.every((status) => status === 'live')) return 'live';
  if (usable.some((status) => status === 'live')) return 'partial';
  return 'stale-cache';
}

function buildCombinedSnapshot({ sourceFeeds, codeIndex, slopSnapshot, contributors, registry, editorial, repositoryAnalyses, workOccupations }) {
  const feeds = sourceFeeds?.feeds || {};
  const radar = feeds['ai-code-radar'];
  const meo = feeds['meo-workforce-data'];
  const botcommits = feeds.botcommits;
  const observations = [];

  if (radar) {
    observations.push(createCombinedObservation({
      id: radar.id,
      category: 'code',
      metric: radar.metric,
      value: numeric(radar.value),
      unit: 'percent',
      status: radar.status,
      source: radar.source,
      observedAt: radar.computedAt || radar.fetchedAt,
      coverage: radar.coverage,
      comparable: true,
      note: radar.note,
      extra: {
        repositoryMedian: numeric(radar.repositoryMedian),
        quality: radar.quality,
        byTool: radar.byTool || [],
        byLanguage: radar.byLanguage || []
      }
    }));
  }

  if (repositoryAnalyses && Number.isFinite(Number(repositoryAnalyses.value))) {
    observations.push(createCombinedObservation({
      id: repositoryAnalyses.id,
      category: 'code',
      metric: repositoryAnalyses.metric,
      value: numeric(repositoryAnalyses.value),
      unit: 'percent',
      status: repositoryAnalyses.status,
      source: repositoryAnalyses.source,
      observedAt: repositoryAnalyses.computedAt || repositoryAnalyses.fetchedAt,
      coverage: repositoryAnalyses.coverage,
      comparable: true,
      note: repositoryAnalyses.note,
      extra: {
        repositoryMedian: numeric(repositoryAnalyses.repositoryMedian),
        lineWeighted: numeric(repositoryAnalyses.lineWeighted)
      }
    }));
  }

  if (slopSnapshot && Number.isFinite(Number(slopSnapshot.medianCodeIndex))) {
    observations.push(createCombinedObservation({
      id: 'slopscore',
      category: 'code',
      metric: 'repository-ai-heuristic',
      value: numeric(slopSnapshot.medianCodeIndex),
      unit: 'heuristic-index-0-100',
      status: slopSnapshot.status || 'stale-cache',
      source: slopSnapshot.source || CATALOG_URL,
      observedAt: slopSnapshot.updatedAt || slopSnapshot.catalogFetchedAt,
      coverage: slopSnapshot.coverage,
      note: 'Auxiliary repository heuristic. It is intentionally excluded from the compatible percentage median because it is not the same metric as AI Code Radar.'
    }));
  }

  if (meo) {
    observations.push(createCombinedObservation({
      id: meo.id,
      category: 'work',
      metric: meo.metric,
      value: numeric(meo.value),
      unit: 'score-0-100',
      status: meo.status,
      source: meo.source,
      observedAt: meo.generatedAt || meo.fetchedAt,
      coverage: meo.coverage,
      note: meo.note,
      extra: { topExposed: meo.topExposed || [] }
    }));
  }

  const workBaseline = createWorkBaselineObservation();
  observations.push(createCombinedObservation({
    id: workBaseline.id,
    category: 'work',
    metric: workBaseline.metric,
    value: workBaseline.value,
    unit: 'percent',
    status: workBaseline.status,
    source: workBaseline.source,
    comparable: true,
    note: workBaseline.note
  }));

  if (workOccupations) {
    observations.push(createCombinedObservation({
      id: workOccupations.id,
      category: 'work',
      metric: workOccupations.metric,
      value: numeric(workOccupations.value),
      unit: 'percent',
      status: workOccupations.status,
      source: workOccupations.source,
      observedAt: workOccupations.computedAt,
      coverage: workOccupations.coverage,
      comparable: workOccupations.comparable,
      note: workOccupations.note,
      extra: {
        run: workOccupations.run,
        regions: workOccupations.regions,
        distribution: workOccupations.distribution,
        history: workOccupations.history
      }
    }));
  }

  if (botcommits) {
    observations.push(createCombinedObservation({
      id: botcommits.id,
      category: 'code',
      metric: botcommits.metric,
      value: numeric(botcommits.value),
      unit: 'public-commits-per-month',
      status: botcommits.status,
      source: botcommits.source,
      observedAt: botcommits.updatedAt || botcommits.fetchedAt,
      coverage: botcommits.coverage,
      note: botcommits.note,
      extra: { period: botcommits.period, series: botcommits.series || [] }
    }));
  }

  if (contributors) {
    observations.push(createCombinedObservation({
      id: 'github-ai-contributors',
      category: 'code',
      metric: 'public-repositories-with-ai-linked-contributions',
      value: numeric(contributors.summary?.projectCount),
      unit: 'repositories',
      status: contributors.status,
      source: contributors.source || GITHUB_API_URL,
      observedAt: contributors.fetchedAt,
      coverage: {
        contributors: numeric(contributors.summary?.contributorCount),
        commits: numeric(contributors.summary?.commitCount),
        pullRequests: contributors.contributors?.reduce((sum, item) => sum + (Number(item.totalPullRequests) || 0), 0) || 0
      },
      lowerBound: Boolean(contributors.summary?.limited),
      note: contributors.note,
      extra: {
        auth: contributors.auth || null,
        window: contributors.window || null,
        reportedCommitCount: contributors.summary?.reportedCommitCount ?? null
      }
    }));
  }

  for (const observation of Array.isArray(editorial?.observations) ? editorial.observations : []) {
    observations.push(createCombinedObservation({
      id: observation.id,
      category: observation.category || 'editorial',
      metric: observation.metric,
      value: observation.value === null || observation.value === undefined ? null : numeric(observation.value),
      unit: observation.unit,
      status: observation.status || 'reported',
      source: observation.source,
      observedAt: observation.observedAt,
      coverage: observation.coverage,
      lowerBound: Boolean(observation.lowerBound),
      note: observation.note,
      extra: { range: observation.range || null }
    }));
  }

  observations.push(createCombinedObservation({
    id: 'ossinsight',
    category: 'code',
    metric: 'github-public-activity-analytics',
    value: null,
    unit: 'reference-only',
    status: 'reference-only',
    source: OSSINSIGHT_API_URL,
    note: 'OSSInsight is registered as an independent public-activity cross-check. Its documented beta API is repository/project-oriented and does not provide a global AI-attribution percentage.'
  }));

  const compatibleValues = observations
    .filter((observation) => observation.category === 'code' && observation.comparable && observation.unit === 'percent')
    .map((observation) => observation.value);
  const codeValue = roundMetric(median(compatibleValues));
  const workIndex = buildWorkIndex(workOccupations);
  const statusValues = [
    ...Object.values(feeds).map((feed) => feed.status),
    contributors?.status,
    slopSnapshot?.status
  ];
  const combinedSnapshotStatus = combinedStatus(statusValues);
  const metrics = createDashboardMetricSnapshot(
    codeValue,
    combinedSnapshotStatus,
    codeIndex?.updatedAt || radar?.computedAt || radar?.fetchedAt || null,
    workIndex.value
  );

  return {
    version: 1,
    status: combinedSnapshotStatus,
    fetchedAt: new Date().toISOString(),
    metrics,
    methodology: {
      code: {
        value: codeValue,
        unit: 'percent',
        aggregation: 'median-compatible-percentages',
        sourcesUsed: observations.filter((observation) => observation.category === 'code' && observation.comparable && observation.unit === 'percent').map((observation) => observation.id),
        sourcesExcluded: observations.filter((observation) => observation.category === 'code' && (!observation.comparable || observation.unit !== 'percent')).map((observation) => observation.id),
        note: 'Different units are retained as separate observations. No global percentage is invented from commit counts, repository counts, or occupational exposure.'
      },
      work: workIndex,
      overall: {
        value: metrics?.overall ?? null,
        unit: 'percent',
        status: metrics ? 'model-estimate' : 'not-calculated',
        weights: DASHBOARD_METRICS.weights,
        note: 'The displayed total is a weighted model estimate from Code, Work, and Life. Work is the median of the prototype estimate and model-rated occupations; Life remains illustrative.'
      }
    },
    observations,
    sourceCatalog: registry?.sources || [],
    inputs: {
      codeIndex: codeIndex || null,
      sourceFeeds: sourceFeeds || null,
      slopScoreIndex: slopSnapshot || null,
      githubContributors: contributors || null,
      repositoryAnalyses: repositoryAnalyses || null,
      workOccupations: workOccupations || null
    }
  };
}

async function getCombinedSnapshot({ refresh = false } = {}) {
  const cached = await readJsonFile(COMBINED_SNAPSHOT_CACHE_FILE, null);
  try {
    const [sourceFeeds, codeIndex, slopSnapshot, contributors, registry, editorial, repositoryAnalyses, workOccupations] = await Promise.all([
      getSourceFeeds({ refresh }),
      getCodeIndex({ refresh }),
      readJsonFile(CODE_INDEX_CACHE_FILE, null),
      getGithubContributors({ refresh }),
      readJsonFile(SOURCES_FILE, { version: 1, sources: [] }),
      readJsonFile(EDITORIAL_OBSERVATIONS_FILE, { version: 1, observations: [] }),
      getRepositoryAnalysesCodeObservation(),
      getWorkOccupationsObservation()
    ]);
    const snapshot = buildCombinedSnapshot({ sourceFeeds, codeIndex, slopSnapshot, contributors, registry, editorial, repositoryAnalyses, workOccupations });
    await writeJsonFile(COMBINED_SNAPSHOT_CACHE_FILE, snapshot);
    try {
      await recordMetricSnapshot(snapshot.metrics);
    } catch (error) {
      console.warn(`Could not record metric series point: ${error.message}`);
    }
    return snapshot;
  } catch (error) {
    if (cached) return { ...cached, status: 'stale-cache', error: error.message };
    return {
      version: 1,
      status: 'unavailable',
      fetchedAt: null,
      methodology: { code: { value: null }, work: { value: null }, overall: { value: null, status: 'not-calculated' } },
      observations: [],
      sourceCatalog: [],
      inputs: {},
      error: error.message
    };
  }
}

async function getSlopScore(repo, branch) {
  const cache = await readCache();
  const key = cacheKey(repo, branch);

  try {
    const payload = await fetchSlopScore(repo, branch);
    cache.entries[key] = payload;
    await writeCache(cache);
    return payload;
  } catch (error) {
    const cached = cache.entries[key];
    if (cached) {
      console.warn(`Slop Score unavailable; serving cached value for ${repo}:`, error.message);
      return { ...cached, status: 'stale-cache', cachedAt: cached.fetchedAt, error: error.message };
    }

    console.warn(`Slop Score unavailable and no cache exists for ${repo}:`, error.message);
    return {
      status: 'baseline',
      repo,
      branch,
      codeIndex: 42,
      score: null,
      fetchedAt: null,
      error: error.message
    };
  }
}

function sendApiError(response, error) {
  const failure = isGitHubRateLimitError(error) && !error.statusCode ? toGitHubRateLimitHttpError(error) : error;
  sendJson(response, failure.statusCode || 500, {
    status: 'unavailable',
    ...(failure.code ? { code: failure.code } : {}),
    ...(failure.code === 'github-rate-limit' ? { retryAt: failure.retryAt || null } : {}),
    error: failure.message
  });
}

const ALLOWED_CORS_ORIGINS = new Set([
  'https://ffnwz.github.io',
  'https://ai.ffnwz.lat',
  'http://127.0.0.1:8765',
  'http://localhost:8765'
]);

function applyCorsHeaders(request, response) {
  const origin = request.headers.origin;
  if (!origin || !ALLOWED_CORS_ORIGINS.has(origin)) return;
  response.setHeader('access-control-allow-origin', origin);
  response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
  response.setHeader('access-control-allow-headers', 'Accept, Content-Type');
  response.setHeader('access-control-max-age', '600');
  response.setHeader('vary', 'Origin');
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body)
  });
  response.end(body);
}

async function readJsonRequestBody(request, maxBytes = 20_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw repositoryAnalysisError('Запрос слишком большой.', 413);
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    throw repositoryAnalysisError('Тело запроса должно быть JSON.', 400);
  }
}

function safeStaticPath(requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const routeFiles = {
    '/': 'index.html',
    '/work': 'occupations.html',
    '/work/': 'occupations.html'
  };
  const relative = routeFiles[decoded] || decoded.replace(/^[/\\]+/, '');
  const resolved = path.resolve(ROOT, relative);
  const rootPrefix = ROOT.endsWith(path.sep) ? ROOT : `${ROOT}${path.sep}`;
  return resolved === ROOT || resolved.startsWith(rootPrefix) ? resolved : null;
}

async function serveStatic(requestPath, response) {
  const filePath = safeStaticPath(requestPath);
  if (!filePath) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const body = await fs.readFile(filePath);
    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    response.writeHead(200, { 'content-type': type, 'content-length': body.length });
    response.end(body);
  } catch (error) {
    const statusCode = error.code === 'ENOENT' ? 404 : 500;
    response.writeHead(statusCode, { 'content-type': 'text/plain; charset=utf-8' });
    response.end(statusCode === 404 ? 'Not found' : 'Server error');
  }
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);
  applyCorsHeaders(request, response);

  if (request.method === 'OPTIONS' && requestUrl.pathname.startsWith('/api/')) {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/code-index') {
    const refresh = requestUrl.searchParams.get('refresh') === '1';
    sendJson(response, 200, await getCodeIndex({ refresh }));
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/code-index-progress') {
    sendJson(response, 200, await getCodeIndexProgress());
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/sources') {
    sendJson(response, 200, await getSources());
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/source-feeds') {
    const refresh = requestUrl.searchParams.get('refresh') === '1';
    sendJson(response, 200, await getSourceFeeds({ refresh }));
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/combined-snapshot') {
    const refresh = requestUrl.searchParams.get('refresh') === '1';
    sendJson(response, 200, await getCombinedSnapshot({ refresh }));
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/work-index') {
    sendJson(response, 200, await getWorkIndex());
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/work-occupations') {
    sendJson(response, 200, await getWorkOccupations());
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/metric-series') {
    const days = requestUrl.searchParams.get('days');
    sendJson(response, 200, await getMetricSeries(days));
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/repository-analysis') {
    try {
      const repository = requestUrl.searchParams.get('repo') || requestUrl.searchParams.get('repository');
      sendJson(response, 200, await getRepositoryAnalysis({ input: repository, refresh: false }));
    } catch (error) {
      sendApiError(response, error);
    }
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/repository-analyses') {
    sendJson(response, 200, await getRepositoryAnalyses());
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/contributor-profiles') {
    sendJson(response, 200, await getContributorProfiles());
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/contributor-analysis') {
    try {
      const body = await readJsonRequestBody(request);
      sendJson(response, 200, await getContributorAnalysis({ input: body.profile || body.login || body.url }));
    } catch (error) {
      sendApiError(response, error);
    }
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/repository-analysis') {
    try {
      const body = await readJsonRequestBody(request);
      const input = body.repository || body.repo || body.url;
      const refresh = body.refresh !== false;
      sendJson(response, 200, await getRepositoryAnalysis({ input, refresh }));
    } catch (error) {
      sendApiError(response, error);
    }
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/github-contributors') {
    const refresh = requestUrl.searchParams.get('refresh') === '1';
    sendJson(response, 200, await getGithubContributors({ refresh }));
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/slopscore') {
    const repo = requestUrl.searchParams.get('repo') || DEFAULT_REPO;
    const branch = requestUrl.searchParams.get('branch') || DEFAULT_BRANCH;
    if (!/^https?:\/\//i.test(repo) || repo.length > 500 || branch.length > 100) {
      sendJson(response, 400, { error: 'Invalid repository or branch' });
      return;
    }
    sendJson(response, 200, await getSlopScore(repo, branch));
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { allow: 'GET, HEAD' });
    response.end();
    return;
  }

  await serveStatic(requestUrl.pathname, response);
});

server.listen(PORT, HOST, () => {
  console.log(`AI Countdown running at http://${HOST}:${PORT}`);
  console.log(`Slop Score fallback cache: ${CACHE_FILE}`);
  console.log(`Aggregated Code index cache: ${CODE_INDEX_CACHE_FILE}`);
  console.log(`External source feeds cache: ${SOURCE_FEEDS_CACHE_FILE}`);
  console.log(`Source registry: ${SOURCES_FILE}`);
  setTimeout(() => {
    ensureBackgroundCodeIndexRefresh().catch((error) => console.error('Could not start code-index worker:', error.message));
    migrateRepositoryAnalysisHistory().catch((error) => console.error('Could not migrate repository analysis history:', error.message));
  }, 250);
});
