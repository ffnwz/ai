// Rate the recurring everyday-task dataset used by the Life criterion.
//
// Commands:
//   node refresh-life-tasks.js rate [--model <openrouter id>] [--limit <n>]
//   node refresh-life-tasks.js verify
//
// The run is resumable. Set OPENROUTER_KEY and AI_MODEL (or LIFE_MODEL/
// WORK_MODEL) in
// .env. Every run records its prompt, dataset hash, model, assumptions, and
// token usage so the Life median can be reproduced later.

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { passSeeds, mergePasses, checkMergedRatings } = require('./rating-passes');

const ROOT = __dirname;
const DATASET_FILE = path.join(ROOT, 'data', 'life', 'life-tasks.json');
const RATINGS_DIR = path.join(ROOT, 'data', 'life', 'ratings');
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PROMPT_VERSION = 1;
// Every task is rated in `passes` passes with seeds seed, seed + 1, ...; the stored score
// is the median (see rating-passes.js).
const REQUEST_SETTINGS = Object.freeze({ temperature: 0, seed: 42, passes: 3, maxTokens: 12_000 });

const SCALE = Object.freeze({
  0: 'AI cannot meaningfully help with this task.',
  50: 'AI or a smart device can do a substantial part, but a person prepares, supervises, or finishes it.',
  100: 'AI or a device can complete the task to an accepted result without a person doing the task.'
});

const SYSTEM_PROMPT = `You rate recurring household and personal-administration tasks for AI Countdown, a project that measures how much human work AI can already take on.

Judge the task as it can be completed today in a typical home, not a research demo and not a future promise. Include software AI, voice and vision models, agents that use apps, and commercially available smart-home devices or mechanisms such as dishwashers, washing machines, dryers, robot vacuums/mops, smart feeders, and window-cleaning robots. A device only counts for the part it actually performs; loading, unloading, preparation, moving obstacles, maintenance, checking, and decisions remain human work unless the task says otherwise.

Give one integer score from 0 to 100 for each task:
- 0: ${SCALE[0]}
- 50: ${SCALE[50]}
- 100: ${SCALE[100]}

Rate the complete task, including setup, supervision, quality checking, exception handling, and putting things away where relevant. Judge capability rather than household adoption, price, legal permission, or whether a specific family owns the device. Return a short rationale in English (at most 24 words) naming the main human remainder.

Return exactly one rating for every task id you receive.`;

const RATINGS_SCHEMA = {
  type: 'object',
  properties: {
    ratings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          score: { type: 'integer' },
          rationale: { type: 'string' }
        },
        required: ['id', 'score', 'rationale'],
        additionalProperties: false
      }
    }
  },
  required: ['ratings'],
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
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (key && !process.env[key]) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn('Could not load .env:', error.message);
  }
}

async function readJson(filePath, fallback = null) {
  try { return JSON.parse(await fs.readFile(filePath, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') console.warn(`Could not read ${path.basename(filePath)}:`, error.message);
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(temporary, filePath);
}

function sha256(value) { return crypto.createHash('sha256').update(value, 'utf8').digest('hex'); }
// The hash covers what the model is shown, so weighting fields such as householdShare
// can change without invalidating earlier rating runs.
const RATED_TASK_FIELDS = ['id', 'titleEn', 'frequency', 'occurrencesPerYear', 'typicalMinutes', 'devices'];
function datasetHash(dataset) {
  const tasks = (dataset.tasks || []).map((task) => Object.fromEntries(RATED_TASK_FIELDS.map((field) => [field, task[field] ?? null])));
  return sha256(JSON.stringify({ fields: RATED_TASK_FIELDS, tasks }));
}
function promptHash() { return sha256(SYSTEM_PROMPT); }
function modelSlug(model) { return model.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, ''); }
function runFileName(date, model) { return `${date}_${modelSlug(model)}_p${PROMPT_VERSION}.json`; }
function chunk(items, size) { const result = []; for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size)); return result; }

async function openRouterJson({ model, user, seed = REQUEST_SETTINGS.seed }) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
      'content-type': 'application/json',
      'http-referer': 'https://github.com/ffnwz/ai',
      'x-title': 'AI Countdown Life task ratings'
    },
    body: JSON.stringify({
      model,
      temperature: REQUEST_SETTINGS.temperature,
      seed,
      max_tokens: REQUEST_SETTINGS.maxTokens,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: user }],
      response_format: { type: 'json_schema', json_schema: { name: 'life_task_ratings', strict: true, schema: RATINGS_SCHEMA } },
      provider: { require_parameters: true },
      usage: { include: true }
    })
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`OpenRouter returned HTTP ${response.status}: ${body.slice(0, 300)}`);
  const payload = JSON.parse(body);
  const choice = payload.choices?.[0];
  if (!choice) throw new Error(`OpenRouter returned no choices: ${body.slice(0, 300)}`);
  const content = String(choice.message?.content || '').trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  return {
    parsed: JSON.parse(content),
    provider: payload.provider || null,
    usage: {
      inputTokens: payload.usage?.prompt_tokens || 0,
      outputTokens: payload.usage?.completion_tokens || 0,
      costUsd: Number(payload.usage?.cost) || 0
    }
  };
}

async function rate(args) {
  const dataset = await readJson(DATASET_FILE);
  if (!dataset?.tasks?.length) throw new Error('Life task dataset is missing or empty.');
  const model = args.model || process.env.LIFE_MODEL || process.env.AI_MODEL || process.env.WORK_MODEL;
  if (!process.env.OPENROUTER_KEY) throw new Error('Set OPENROUTER_KEY in .env');
  if (!model) throw new Error('Set AI_MODEL, LIFE_MODEL, or WORK_MODEL in .env, or pass --model');
  const now = new Date();
  const checkedDate = now.toISOString().slice(0, 10);
  const runFile = path.join(RATINGS_DIR, runFileName(checkedDate, model));
  const currentHash = datasetHash(dataset);
  const existing = await readJson(runFile);
  const resumable = existing?.prompt?.sha256 === promptHash() && existing?.inputs?.dataset?.sha256 === currentHash;
  if (existing && !resumable) throw new Error(`${path.relative(ROOT, runFile)} was made with another prompt or dataset; move it away first`);
  const seeds = passSeeds(REQUEST_SETTINGS.seed, REQUEST_SETTINGS.passes);
  const run = resumable ? existing : {
    version: 2,
    checkedAt: now.toISOString(),
    checkedDate,
    provider: 'openrouter',
    model,
    servedBy: [],
    request: { ...REQUEST_SETTINGS, seeds, responseFormat: 'json_schema (strict)', merge: 'median of pass scores per task' },
    scale: SCALE,
    assumptions: { embodiment: ['software agents', 'smart-home devices', 'commercial household mechanisms'] },
    prompt: { version: PROMPT_VERSION, sha256: promptHash(), system: SYSTEM_PROMPT },
    inputs: { dataset: { file: path.relative(ROOT, DATASET_FILE).replace(/\\/g, '/'), sha256: currentHash, tasks: dataset.tasks.length } },
    status: 'partial',
    coverage: { rated: 0, total: dataset.tasks.length },
    usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
    passes: {},
    ratings: {}
  };
  // A one-pass file from the same day becomes the first pass.
  if (!run.passes) {
    run.passes = { [seeds[0]]: run.ratings || {} };
    run.version = 2;
    run.request = { ...REQUEST_SETTINGS, seeds, responseFormat: 'json_schema (strict)', merge: 'median of pass scores per task' };
  }
  run.inputs.dataset.hashFields = RATED_TASK_FIELDS;
  for (const seed of seeds) run.passes[seed] ||= {};
  const ids = dataset.tasks.map((task) => task.id);
  const limit = Number.isFinite(args.limit) ? args.limit : Infinity;
  const work = seeds.flatMap((seed) => chunk(dataset.tasks.filter((task) => !run.passes[seed][task.id]).slice(0, limit), 12).map((batch) => ({ seed, batch })));
  if (!work.length) { console.log(`${path.relative(ROOT, runFile)} is already complete.`); return; }
  const save = async () => {
    run.ratings = mergePasses(run.passes, ids);
    run.coverage.rated = Object.keys(run.ratings).length;
    run.status = run.coverage.rated === run.coverage.total ? 'complete' : 'partial';
    run.updatedAt = new Date().toISOString();
    await writeJson(runFile, run);
  };
  let failed = 0;
  console.log(`Rating ${ids.length} Life tasks x ${seeds.length} passes with ${model} into ${path.relative(ROOT, runFile)} (${work.length} batches)`);
  for (const [index, { seed, batch }] of work.entries()) {
    try {
      const { parsed, provider, usage } = await openRouterJson({
        model,
        seed,
        user: `Rate these recurring household and personal-administration tasks. Each row is id | task | frequency | annual occurrences | typical minutes | available devices:\n\n${batch.map((task) => `${task.id} | ${task.titleEn} | ${task.frequency} | ${task.occurrencesPerYear} | ${task.typicalMinutes} | ${(task.devices || []).join(', ')}`).join('\n')}`
      });
      const wanted = new Set(batch.map((task) => task.id));
      const pass = run.passes[seed];
      for (const rating of parsed.ratings || []) {
        const id = String(rating.id || '').trim();
        const score = Number(rating.score);
        if (!wanted.has(id) || pass[id] || !Number.isFinite(score)) continue;
        pass[id] = { score: Math.max(0, Math.min(100, Math.round(score))), rationale: String(rating.rationale || '').trim() };
      }
      if (provider && !run.servedBy.includes(provider)) run.servedBy.push(provider);
      run.usage.inputTokens += usage.inputTokens;
      run.usage.outputTokens += usage.outputTokens;
      run.usage.costUsd = Math.round((run.usage.costUsd + usage.costUsd) * 1e6) / 1e6;
      console.log(`Batch ${index + 1}/${work.length} (seed ${seed}): ${batch.filter((task) => pass[task.id]).length}/${batch.length} rated`);
    } catch (error) {
      failed += 1;
      console.error(`Batch ${index + 1}/${work.length} (seed ${seed}) failed: ${error.message}`);
    }
    await save();
  }
  console.log(`${run.status}: ${run.coverage.rated}/${run.coverage.total} rated, ${failed} failed batches, $${run.usage.costUsd} spent.`);
  if (failed || run.status !== 'complete') process.exitCode = 1;
}

async function verify() {
  const dataset = await readJson(DATASET_FILE);
  const files = (await fs.readdir(RATINGS_DIR).catch(() => [])).filter((file) => file.endsWith('.json'));
  const ids = new Set((dataset?.tasks || []).map((task) => task.id));
  for (const file of files) {
    const run = await readJson(path.join(RATINGS_DIR, file));
    const unknown = Object.keys(run?.ratings || {}).filter((id) => !ids.has(id));
    const missing = [...ids].filter((id) => !Number.isInteger(run?.ratings?.[id]?.score));
    const merged = checkMergedRatings(run);
    console.log(`${file}: ${ids.size - missing.length}/${ids.size} rated${unknown.length ? `; unknown ids: ${unknown.join(', ')}` : ''}${merged.length ? `; ${merged.join('; ')}` : ''}`);
    if (merged.length || unknown.length) process.exitCode = 1;
  }
}

function parseArgs(argv) {
  const args = { command: argv[0] || 'help', limit: Infinity, model: null };
  for (let index = 1; index < argv.length; index += 1) {
    if (argv[index] === '--limit') args.limit = Math.max(0, Number(argv[++index]) || 0);
    else if (argv[index] === '--model') args.model = argv[++index];
  }
  return args;
}

async function main() {
  loadDotEnv(path.join(ROOT, '.env'));
  const args = parseArgs(process.argv.slice(2));
  if (args.command === 'rate') return rate(args);
  if (args.command === 'verify') return verify();
  console.log('Use: node refresh-life-tasks.js rate [--model <id>] [--limit <n>] or verify');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
