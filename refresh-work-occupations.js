// AI Countdown occupation ratings for the Work criterion.
//
// Data in data/work/ (all of it is meant to be committed):
//   isco08-occupations.json   unified occupation classifier, keyed by ISCO-08 unit group code
//   employment-ilostat.json   employment by ISCO-08 sub-major group for the US, Europe, Russia, Asia
//   ratings/<date>_<model>_p<prompt version>.json
//                             one rating run: check date, model, request settings, prompt and its
//                             hash, classifier hash, and a 0-100 score per occupation code
//
// Commands:
//   node refresh-work-occupations.js inputs   rebuild the classifier (ESCO API) and the employment
//                                              snapshot (ILOSTAT); adds Russian titles when a key is set
//   node refresh-work-occupations.js rate     rate every occupation with WORK_MODEL into a new run
//                                              file dated today; resumes today's file for the same model
//       --model <openrouter id>   override WORK_MODEL
//       --limit <n>               rate at most n occupations in this call
//   node refresh-work-occupations.js verify [files...]
//                                              check run files (all by default) against the classifier
//
// Rating uses OpenRouter: OPENROUTER_KEY and WORK_MODEL in .env or the environment.
// Scale: 0 = AI cannot help, 50 = AI does the job with a person, 100 = AI does it without a person.

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const WORK_DIR = path.join(ROOT, 'data', 'work');
const CLASSIFIER_FILE = path.join(WORK_DIR, 'isco08-occupations.json');
const EMPLOYMENT_FILE = path.join(WORK_DIR, 'employment-ilostat.json');
const RATINGS_DIR = path.join(WORK_DIR, 'ratings');
const ESCO_API_URL = 'https://ec.europa.eu/esco/api/resource';
const ESCO_ISCO_SCHEME = 'http://data.europa.eu/esco/concept-scheme/isco';
const ILOSTAT_API_URL = 'https://rplumber.ilo.org/data/indicator/';
const ILOSTAT_INDICATOR = 'EMP_TEMP_SEX_OC2_NB_A';
const ILOSTAT_MIN_YEAR = 2019;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// v1: software-only AI. v2: AI that also acts through a humanoid robot or a quadcopter drone.
const PROMPT_VERSION = 2;
const REQUEST_SETTINGS = Object.freeze({ temperature: 0, seed: 42, batchSize: 25, reasoningEffort: 'medium', maxTokens: 32000 });
const RATING_CONCURRENCY = 4;
const FETCH_CONCURRENCY = 6;
const REQUEST_TIMEOUT_MS = 120_000;

// Countries with ILOSTAT employment by ISCO-08 sub-major group. Countries
// without data since ILOSTAT_MIN_YEAR are listed as missing in the snapshot.
const REGIONS = Object.freeze({
  us: { label: 'United States', countries: ['USA'] },
  europe: {
    label: 'Europe',
    countries: [
      'AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA', 'DEU', 'GRC', 'HUN', 'IRL',
      'ITA', 'LVA', 'LTU', 'LUX', 'MLT', 'NLD', 'POL', 'PRT', 'ROU', 'SVK', 'SVN', 'ESP', 'SWE',
      'GBR', 'NOR', 'CHE', 'ISL', 'SRB', 'BLR'
    ]
  },
  russia: { label: 'Russia', countries: ['RUS'] },
  asia: {
    label: 'Asia',
    countries: [
      'JPN', 'KOR', 'CHN', 'IND', 'IDN', 'PAK', 'BGD', 'PHL', 'VNM', 'THA', 'MYS', 'SGP', 'KHM', 'LAO',
      'MMR', 'LKA', 'NPL', 'MNG', 'KAZ', 'KGZ', 'UZB', 'TUR', 'IRN', 'IRQ', 'ISR', 'JOR', 'ARE', 'GEO'
    ]
  }
});

const SCALE = Object.freeze({
  0: 'AI cannot help with this job at all.',
  50: 'AI can do the job together with a person who directs, checks, or completes it.',
  100: 'AI is ready to do the job without a person.'
});

// What the AI is assumed to act through, recorded in every run file.
const EMBODIMENT = Object.freeze([
  'software: language models, agents that use software tools and computers, speech, vision, and document models',
  'humanoid robot: a general-purpose body with two arms and hands that walks and uses tools made for people',
  'quadcopter drone: flies and carries cameras, sensors, and light loads'
]);

const SYSTEM_PROMPT = `You rate occupations for AI Countdown, a project that tracks how much human work AI can already take on.

Each occupation is an ISCO-08 unit group: the international classification of jobs used across Europe, Russia, Asia, and the Americas. Judge the typical work of the group as it is done today, not one country's version of it.

The AI is not only software. It can also act in the physical world through a body it controls itself:
- a general-purpose humanoid robot: two arms with hands, walks, and uses tools and spaces made for people;
- a quadcopter drone: flies, and carries cameras, sensors, and light loads.
Judge these bodies by what humanoid robots and drones can do today: their dexterity, strength, speed, battery life, reliability, and safety around people.

For each occupation, give one integer score from 0 to 100 for the occupation as a whole:
- 0: ${SCALE[0]}
- 50: ${SCALE[50]}
- 100: ${SCALE[100]}
Use any value in between when the job sits between these points.

How to judge:
- Think about the core tasks of the occupation and how much working time each one takes. The score describes the whole job, not its easiest task.
- Count AI software that is available now (language models, agents that use software tools and computers, speech, vision, and document models) together with the humanoid robot or drone body.
- Physical work counts as AI work only as far as a humanoid robot or a drone could do it today. Work that needs finer hands, more strength, more endurance, or more reliability than they have stays with people and pulls the score toward 0.
- Rate capability, not legal permission, hardware cost, or how fast employers adopt it.

Return exactly one rating per occupation, using the code you were given, with a rationale in English of at most 20 words.`;

const RATINGS_SCHEMA = {
  type: 'object',
  properties: {
    ratings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          score: { type: 'integer' },
          rationale: { type: 'string' }
        },
        required: ['code', 'score', 'rationale'],
        additionalProperties: false
      }
    }
  },
  required: ['ratings'],
  additionalProperties: false
};

const TITLES_PROMPT = `Give the usual Russian name for each ISCO-08 unit group. Where the Russian occupation classifier OKZ (OK 010-2014, harmonised with ISCO-08) has the group, use its wording. Keep the code you were given.`;

const TITLES_SCHEMA = {
  type: 'object',
  properties: {
    titles: {
      type: 'array',
      items: {
        type: 'object',
        properties: { code: { type: 'string' }, title_ru: { type: 'string' } },
        required: ['code', 'title_ru'],
        additionalProperties: false
      }
    }
  },
  required: ['titles'],
  additionalProperties: false
};

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

async function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn(`Could not read ${path.basename(filePath)}:`, error.message);
    return fallback;
  }
}

async function writeJsonFile(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryFile = `${filePath}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryFile, filePath);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

// The fingerprint covers codes and English titles only, so adding Russian
// titles or refreshing fetchedAt does not invalidate earlier rating runs.
function classifierHash(classifier) {
  const canonical = Object.keys(classifier.occupations).sort()
    .map((code) => `${code}\t${classifier.occupations[code].title}`)
    .join('\n');
  return sha256(canonical);
}

function promptHash() {
  return sha256(SYSTEM_PROMPT);
}

// One file per check date, model, and prompt version: <date>_<model>_p<version>.json
function runFileName(checkedDate, model, promptVersion) {
  return `${checkedDate}_${modelSlug(model)}_p${promptVersion}.json`;
}

function modelSlug(model) {
  return model.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '');
}

// Keys are written in a fixed order so files diff cleanly in git. JavaScript
// lists integer-like keys ("1111".."9629") before the rest ("0110", "0210",
// "0310"), so armed forces codes end up last; the order is still stable.
function sortedObject(object) {
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, object[key]]));
}

async function fetchWithRetry(url, options = {}, attempts = 3) {
  for (let attempt = 1; ; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        const error = new Error(`${url} returned HTTP ${response.status}: ${body.slice(0, 300)}`);
        error.retryable = response.status === 429 || response.status >= 500;
        throw error;
      }
      return await response.text();
    } catch (error) {
      if (attempt >= attempts || error.retryable === false) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    } finally {
      clearTimeout(timer);
    }
  }
}

async function mapWithConcurrency(items, worker, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

function parseArgs(argv) {
  const args = { command: argv[0] || 'help', files: [], limit: Infinity, model: null };
  for (let index = 1; index < argv.length; index += 1) {
    if (argv[index] === '--limit') args.limit = Math.max(0, Number(argv[++index]) || 0);
    else if (argv[index] === '--model') args.model = argv[++index];
    else args.files.push(argv[index]);
  }
  return args;
}

// ---------------------------------------------------------------- OpenRouter

async function openRouterJson({ model, system, user, schemaName, schema, reasoning }) {
  const text = await fetchWithRetry(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
      'content-type': 'application/json',
      'http-referer': 'https://github.com/ai-countdown',
      'x-title': 'AI Countdown'
    },
    body: JSON.stringify({
      model,
      temperature: REQUEST_SETTINGS.temperature,
      seed: REQUEST_SETTINGS.seed,
      max_tokens: REQUEST_SETTINGS.maxTokens,
      reasoning,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      response_format: { type: 'json_schema', json_schema: { name: schemaName, strict: true, schema } },
      provider: { require_parameters: true },
      usage: { include: true }
    })
  });
  const response = JSON.parse(text);
  const choice = response.choices?.[0];
  if (!choice) throw new Error(`OpenRouter returned no choices: ${text.slice(0, 300)}`);
  if (choice.finish_reason === 'length') throw new Error('response hit max_tokens');
  const content = String(choice.message?.content || '').trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`response is not JSON: ${content.slice(0, 200)}`);
  }
  return {
    parsed,
    provider: response.provider || null,
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      costUsd: Number(response.usage?.cost) || 0
    }
  };
}

function requireOpenRouter(model) {
  if (!process.env.OPENROUTER_KEY) throw new Error('Set OPENROUTER_KEY in .env');
  if (!model) throw new Error('Set WORK_MODEL in .env or pass --model');
}

// -------------------------------------------------------------------- inputs

// ISCO-08 from the ESCO API: 10 major groups -> 43 sub-major -> 130 minor -> 436 unit groups.
async function fetchIscoUnits() {
  const getJson = async (url) => JSON.parse(await fetchWithRetry(url, { headers: { accept: 'application/json' } }));
  const getConcept = (uri) => getJson(`${ESCO_API_URL}/concept?uri=${encodeURIComponent(uri)}&language=en`);
  const children = (concept) => (concept._links?.narrowerConcept || []).map((link) => link.uri);

  console.log('Downloading ISCO-08 from the ESCO API');
  const scheme = await getJson(`${ESCO_API_URL}/taxonomy?uri=${encodeURIComponent(ESCO_ISCO_SCHEME)}&language=en`);
  const majors = await mapWithConcurrency((scheme._links?.hasTopConcept || []).map((link) => link.uri), getConcept, FETCH_CONCURRENCY);
  const subMajors = await mapWithConcurrency(majors.flatMap(children), getConcept, FETCH_CONCURRENCY);
  const minors = await mapWithConcurrency(subMajors.flatMap(children), getConcept, FETCH_CONCURRENCY);

  const groupTitles = new Map([...majors, ...subMajors, ...minors].map((concept) => [String(concept.code), concept.title]));
  const units = minors.flatMap((minor) => (minor._links?.narrowerConcept || []).map((link) => ({
    code: String(link.code),
    title: link.title
  }))).filter((unit) => /^\d{4}$/.test(unit.code));
  if (units.length < 400) throw new Error(`ESCO returned only ${units.length} ISCO-08 unit groups`);
  return { units, groupTitles };
}

async function buildClassifier(previous) {
  const { units, groupTitles } = await fetchIscoUnits();
  const occupations = {};
  for (const unit of units.sort((left, right) => left.code.localeCompare(right.code))) {
    const group = (length) => ({ code: unit.code.slice(0, length), title: groupTitles.get(unit.code.slice(0, length)) || null });
    occupations[unit.code] = {
      title: unit.title,
      titleRu: previous?.occupations?.[unit.code]?.titleRu || null,
      major: group(1),
      subMajor: group(2),
      minor: group(3)
    };
  }
  return {
    version: 1,
    classification: 'ISCO-08',
    level: 'unit group (4 digits)',
    key: 'ISCO-08 unit group code',
    source: `${ESCO_API_URL}/taxonomy?uri=${ESCO_ISCO_SCHEME}`,
    fetchedAt: new Date().toISOString(),
    titleRuSource: previous?.titleRuSource || null,
    occupations: sortedObject(occupations)
  };
}

async function addRussianTitles(classifier, model) {
  const missing = Object.entries(classifier.occupations).filter(([, occupation]) => !occupation.titleRu);
  if (!missing.length) return;
  console.log(`Adding Russian titles for ${missing.length} occupations with ${model}`);
  await mapWithConcurrency(chunk(missing, 50), async (batch) => {
    const { parsed } = await openRouterJson({
      model,
      system: TITLES_PROMPT,
      user: batch.map(([code, occupation]) => `${code} | ${occupation.title}`).join('\n'),
      schemaName: 'occupation_titles',
      schema: TITLES_SCHEMA,
      reasoning: { enabled: false }
    }).catch((error) => {
      console.warn(`Russian titles batch failed: ${error.message}`);
      return { parsed: { titles: [] } };
    });
    for (const item of parsed.titles || []) {
      const occupation = classifier.occupations[String(item.code).trim()];
      if (occupation && !occupation.titleRu && item.title_ru) occupation.titleRu = String(item.title_ru).trim();
    }
  }, RATING_CONCURRENCY);
  classifier.titleRuSource = `machine translation by ${model}, prompted to follow OKZ OK 010-2014`;
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') { current += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else current += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { cells.push(current); current = ''; }
    else current += char;
  }
  cells.push(current);
  return cells;
}

// Employment (persons) by ISCO-08 sub-major group, latest year per country.
async function buildEmploymentSnapshot() {
  const countries = Object.values(REGIONS).flatMap((region) => region.countries);
  const url = `${ILOSTAT_API_URL}?id=${ILOSTAT_INDICATOR}&ref_area=${countries.join('+')}&sex=SEX_T&format=.csv&timefrom=${ILOSTAT_MIN_YEAR}`;
  console.log('Downloading employment by occupation from ILOSTAT');
  const lines = (await fetchWithRetry(url, { headers: { accept: 'text/csv' } })).replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]);
  const [areaColumn, groupColumn, yearColumn, valueColumn] = ['ref_area', 'classif1', 'time', 'obs_value'].map((name) => header.indexOf(name));

  const latest = new Map();
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const area = cells[areaColumn];
    const year = Number(cells[yearColumn]);
    const value = Number(cells[valueColumn]);
    const group = /^OC2_ISCO08_(\d{2})$/.exec(cells[groupColumn])?.[1];
    if (!group || !Number.isFinite(value)) continue;
    const current = latest.get(area);
    if (!current || year > current.year) latest.set(area, { year, groups: {} });
    if (latest.get(area).year === year) latest.get(area).groups[group] = Math.round(value * 1000);
  }

  const regions = {};
  for (const [id, region] of Object.entries(REGIONS)) {
    const included = region.countries.filter((country) => latest.has(country));
    const groups = {};
    for (const country of included) {
      for (const [group, value] of Object.entries(latest.get(country).groups)) groups[group] = (groups[group] || 0) + value;
    }
    regions[id] = {
      label: region.label,
      employment: Object.values(groups).reduce((sum, value) => sum + value, 0),
      countries: included.map((country) => ({
        code: country,
        year: latest.get(country).year,
        employment: Object.values(latest.get(country).groups).reduce((sum, value) => sum + value, 0)
      })),
      missingCountries: region.countries.filter((country) => !latest.has(country)),
      subMajorGroups: sortedObject(groups)
    };
  }
  return {
    version: 1,
    source: url,
    indicator: ILOSTAT_INDICATOR,
    unit: 'persons',
    note: 'Latest year per country since the minimum year. ILOSTAT publishes these counts in thousands.',
    minimumYear: ILOSTAT_MIN_YEAR,
    fetchedAt: new Date().toISOString(),
    regions
  };
}

async function commandInputs() {
  const previous = await readJsonFile(CLASSIFIER_FILE, null);
  const [classifier, employment] = await Promise.all([buildClassifier(previous), buildEmploymentSnapshot()]);
  const model = process.env.WORK_MODEL;
  if (process.env.OPENROUTER_KEY && model) await addRussianTitles(classifier, model);
  else console.log('OPENROUTER_KEY or WORK_MODEL is not set; Russian titles are left empty.');

  if (previous && classifierHash(previous) !== classifierHash(classifier)) {
    console.warn('The classifier changed: earlier rating runs refer to the previous classifier hash.');
  }
  await writeJsonFile(CLASSIFIER_FILE, classifier);
  await writeJsonFile(EMPLOYMENT_FILE, employment);
  console.log(`Saved ${Object.keys(classifier.occupations).length} occupations (classifier ${classifierHash(classifier).slice(0, 12)})`);
  for (const [id, region] of Object.entries(employment.regions)) {
    console.log(`${id}: ${region.countries.length} countries, ${Math.round(region.employment / 1e6)}M employed${region.missingCountries.length ? `; no data: ${region.missingCountries.join(', ')}` : ''}`);
  }
}

// ---------------------------------------------------------------------- rate

async function commandRate(args) {
  const model = args.model || process.env.WORK_MODEL;
  requireOpenRouter(model);
  const classifier = await readJsonFile(CLASSIFIER_FILE, null);
  if (!classifier) throw new Error('No classifier yet: run `node refresh-work-occupations.js inputs` first');

  const now = new Date();
  const checkedDate = now.toISOString().slice(0, 10);
  const runFile = path.join(RATINGS_DIR, runFileName(checkedDate, model, PROMPT_VERSION));
  const currentClassifierHash = classifierHash(classifier);
  const existing = await readJsonFile(runFile, null);
  const resumable = existing
    && existing.prompt?.sha256 === promptHash()
    && existing.inputs?.classifier?.sha256 === currentClassifierHash;
  if (existing && !resumable) throw new Error(`${path.relative(ROOT, runFile)} was made with another prompt or classifier; move it away first`);

  const run = resumable ? existing : {
    version: 1,
    checkedAt: now.toISOString(),
    checkedDate,
    provider: 'openrouter',
    model,
    servedBy: [],
    request: { ...REQUEST_SETTINGS, responseFormat: 'json_schema (strict)' },
    scale: SCALE,
    assumptions: { embodiment: EMBODIMENT },
    prompt: { version: PROMPT_VERSION, sha256: promptHash(), system: SYSTEM_PROMPT },
    inputs: {
      classifier: { file: path.relative(ROOT, CLASSIFIER_FILE).replace(/\\/g, '/'), sha256: currentClassifierHash, occupations: Object.keys(classifier.occupations).length }
    },
    status: 'partial',
    coverage: { rated: 0, total: Object.keys(classifier.occupations).length },
    usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
    ratings: {}
  };

  const pending = Object.keys(classifier.occupations)
    .filter((code) => !run.ratings[code])
    .slice(0, args.limit)
    .map((code) => ({ code, ...classifier.occupations[code] }));
  if (!pending.length) {
    console.log(`${path.relative(ROOT, runFile)} is already complete.`);
    return;
  }

  const save = async () => {
    run.ratings = sortedObject(run.ratings);
    run.coverage.rated = Object.keys(run.ratings).length;
    run.status = run.coverage.rated === run.coverage.total ? 'complete' : 'partial';
    run.updatedAt = new Date().toISOString();
    await writeJsonFile(runFile, run);
  };

  const batches = chunk(pending, REQUEST_SETTINGS.batchSize);
  let failedBatches = 0;
  let writeQueue = Promise.resolve();
  console.log(`Rating ${pending.length} occupations with ${model} into ${path.relative(ROOT, runFile)}`);
  await mapWithConcurrency(batches, async (batch, index) => {
    try {
      const { parsed, provider, usage } = await openRouterJson({
        model,
        system: SYSTEM_PROMPT,
        user: `Rate these ${batch.length} occupations (ISCO-08 code | unit group | minor group):\n\n${batch.map((item) => `${item.code} | ${item.title} | ${item.minor.title}`).join('\n')}`,
        schemaName: 'occupation_ratings',
        schema: RATINGS_SCHEMA,
        reasoning: { effort: REQUEST_SETTINGS.reasoningEffort }
      });
      const wanted = new Set(batch.map((item) => item.code));
      let rated = 0;
      for (const rating of parsed.ratings || []) {
        const code = String(rating.code).trim();
        const score = Number(rating.score);
        if (!wanted.has(code) || run.ratings[code] || !Number.isFinite(score)) continue;
        run.ratings[code] = { score: Math.min(100, Math.max(0, Math.round(score))), rationale: String(rating.rationale || '').trim() };
        rated += 1;
      }
      if (provider && !run.servedBy.includes(provider)) run.servedBy.push(provider);
      run.usage.inputTokens += usage.inputTokens;
      run.usage.outputTokens += usage.outputTokens;
      run.usage.costUsd = Math.round((run.usage.costUsd + usage.costUsd) * 1e6) / 1e6;
      const missing = batch.length - rated;
      console.log(`Batch ${index + 1}/${batches.length}: ${rated} rated${missing ? `, ${missing} missing (the next call retries them)` : ''}`);
    } catch (error) {
      failedBatches += 1;
      console.error(`Batch ${index + 1}/${batches.length} failed: ${error.message}`);
    }
    writeQueue = writeQueue.then(save);
    await writeQueue;
  }, RATING_CONCURRENCY);

  console.log(`${run.status}: ${run.coverage.rated}/${run.coverage.total} rated, ${failedBatches} failed batches, $${run.usage.costUsd} spent.`);
  if (run.status !== 'complete') console.log('Run the same command again to fill the gaps.');
  if (failedBatches) process.exitCode = 1;
}

// -------------------------------------------------------------------- verify

async function commandVerify(args) {
  const classifier = await readJsonFile(CLASSIFIER_FILE, null);
  if (!classifier) throw new Error('No classifier to verify against');
  const hash = classifierHash(classifier);
  const files = args.files.length
    ? args.files.map((file) => path.resolve(file))
    : (await fs.readdir(RATINGS_DIR).catch(() => [])).filter((file) => file.endsWith('.json')).map((file) => path.join(RATINGS_DIR, file));

  let problems = 0;
  for (const file of files) {
    const run = await readJsonFile(file, null);
    const issues = [];
    if (!run) issues.push('not readable JSON');
    else {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(run.checkedDate || '') || !Number.isFinite(Date.parse(run.checkedAt))) issues.push('missing checkedDate/checkedAt');
      if (!run.model) issues.push('missing model');
      if (run.prompt?.sha256 !== sha256(run.prompt?.system || '')) issues.push('prompt text does not match prompt.sha256');
      if (run.inputs?.classifier?.sha256 !== hash) issues.push('made against another classifier');
      const ratings = Object.entries(run.ratings || {});
      const unknown = ratings.filter(([code]) => !classifier.occupations[code]).map(([code]) => code);
      const invalid = ratings.filter(([, rating]) => !Number.isInteger(rating?.score) || rating.score < 0 || rating.score > 100).map(([code]) => code);
      if (unknown.length) issues.push(`unknown codes: ${unknown.slice(0, 10).join(', ')}`);
      if (invalid.length) issues.push(`scores outside 0-100: ${invalid.slice(0, 10).join(', ')}`);
      if (run.coverage?.rated !== ratings.length) issues.push('coverage.rated does not match the ratings');
      const expected = runFileName(run.checkedDate, run.model || '', run.prompt?.version);
      if (path.basename(file) !== expected) issues.push(`file should be named ${expected}`);
    }
    problems += issues.length;
    console.log(`${issues.length ? 'FAIL' : 'ok  '} ${path.relative(ROOT, file)}${run ? ` · ${run.model} · ${run.coverage?.rated}/${run.coverage?.total}` : ''}`);
    for (const issue of issues) console.log(`     ${issue}`);
  }
  if (!files.length) console.log('No rating runs yet.');
  if (problems) process.exitCode = 1;
}

async function main() {
  loadDotEnv(path.join(ROOT, '.env'));
  const args = parseArgs(process.argv.slice(2));
  if (args.command === 'inputs') return commandInputs();
  if (args.command === 'rate') return commandRate(args);
  if (args.command === 'verify') return commandVerify(args);
  console.log('Usage: node refresh-work-occupations.js <inputs|rate|verify> [--model id] [--limit n] [files...]');
  process.exitCode = args.command === 'help' ? 0 : 1;
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
