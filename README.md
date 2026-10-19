# AI Countdown

AI Countdown is an open research prototype about how much of life AI already occupies.

English version · [Русская версия](README.ru.md)

Live site: [ai.ffnwz.lat](https://ai.ffnwz.lat)

## What it measures

The dashboard follows three directions:

- **Code** — AI-agent participation in public software development;
- **Work** — AI use in work tasks and business processes;
- **Life** — AI use in everyday personal tasks.

The dashboard is not a precise global replacement percentage. The sources use different denominators, time periods, and evidence standards, so each signal is stored with its own provenance and limitations.

## Architecture

- `server.js` is the Node.js backend, API, cache layer, and background analysis worker;
- `app.js` is the frontend, localization layer, animation system, and chart-card exporter;
- `data/` contains source registries, classifiers, occupation inputs, the everyday-task taxonomy, model runs, and local fallback data;
- runtime state (repository analyses, contributor profiles, the metric series, source caches, the Slop Score crawl, and locks) lives in MongoDB through `storage.js`; nothing is written to `data/` while Mongo is reachable. Without Mongo (or with `AI_COUNTDOWN_MONGO=false`) the same state falls back to JSON files in `data/`, and existing JSON files are imported into empty collections once;
- the HTTP server serves only an allowlist of public pages, scripts, images, and committed reference data; `.env`, server code, scripts, and runtime data are never served;
- API errors carry a stable `code` (`invalid-request`, `github-rate-limit`, `storage-unavailable`, `internal-error`, …) and a message that is safe to show; internal failures add an `incidentId` that matches the server log;
- GitHub API access stays on the backend. Tokens are never sent to the browser.

## Repository analysis

Visitors can submit a public GitHub repository. The backend:

1. stores the repository and measurement history;
2. returns the first 300 commits quickly;
3. continues the remaining public history in the background;
4. recognizes AI agents from public accounts, emails, `Co-Authored-By` markers, and signatures agents write into the commit body ("Generated with Claude Code", `Amp-Thread`); a product name in a commit title is not authorship;
5. counts dependency, release, translation, and CI bots (Dependabot, Renovate, GitHub Actions, Weblate, and any other `[bot]` account that is not a known AI agent) as **automation**: neither human work nor AI-written code, so AI shares are taken over AI + human changed lines only;
6. shows agent and other-contributor shares by changed lines (histories over 5,000 commits are analyzed for the last 12 months; one analysis keeps at most the newest 8,000 commits);
7. reuses the saved result for 24 hours before starting another analysis.

For the Code index each repository's AI share is taken over its commits from the last 12 months, with at least 20 human and AI commits. Besides visitor submissions, the server analyzes the reference set in [`data/reference-repositories.json`](data/reference-repositories.json) (46 widely used projects across ecosystems) in the background and refreshes it weekly, without the recursive profile crawl. The author-repository heuristic is a profile signal only: it marks a contributor's likely agent but does not reassign their commits. Shares count commits with public AI markers only, so they are a lower bound.

Agent accounts, exact agent addresses, commit-body signatures, and the automation list live in [`data/ai-agents.json`](data/ai-agents.json). GitHub's `web-flow` committer of web-UI merges is never taken for the author. When the rules change, the classification version goes up; analyses that keep each commit's classification are reclassified in place at startup, older ones on their next analysis.

When an agent appears in `Co-Authored-By`, the whole commit is assigned to that agent. GitHub does not provide a line-level split between co-authors. For a human author, a recognized agent commit starts an active temporal sequence: subsequent agent-free commits stay attributed to that agent until the author makes agent-free commits on three different dates; the next commit is human-owned again. A recognized commit with another agent switches the active sequence immediately. This inference is recalculated over the complete chronological history as background pages arrive.

Contributor profiles inspect up to 30 of the user's own non-fork public repositories, ordered by latest push. The sampled repositories are deduplicated and queued for one bounded background analysis hop; child repository analyses do not recursively start another crawl. This keeps the recursive expansion finite while allowing the same evidence to enter the repository dataset.

### Top 3 repositories

The Top 3 ranking uses a size-adjusted score:

```text
leaderboard score = AI changed lines × min(1, total changed lines / 10,000)
```

`Total changed lines` means additions plus deletions in the analyzed history. It is not the number of unique lines remaining in the current HEAD. The size adjustment prevents a small repository with 100% AI attribution from automatically outranking a much larger project.

## API

- `GET /api/combined-snapshot` — combined dashboard snapshot;
- `GET /last.json` — compact public JSON with Code, Work, Life, Overall, the separate `selfBuild` value, and update timestamps;
- `GET /api/metric-series` — historical Code, Work, Life, Overall, and `selfBuild` values;
- `GET /api/self-building` — the self-building metric, source materials, exclusions, methodology, and its curated history;
- `GET /api/repository-analyses` — saved analyses and the Top 3 ranking;
- `GET /api/repository-analysis?repo=...` — a public repository analysis;
- `POST /api/repository-analysis` — start or resume an analysis;
- `POST /api/contributor-analysis` — inspect a contributor's own repositories;
- `GET /api/source-feeds` — external sources and freshness status.
- `GET /api/life-index` — median Life index and its compatible sources;
- `GET /api/life-tasks` — frequency-weighted everyday-task dataset and model ratings.

## Local development

Node.js 20 or newer is recommended.

```powershell
npm start
```

Open `http://127.0.0.1:8765/` after the server starts.

## Local operations

The `scripts/` directory contains local helpers for repeatable maintenance:

```powershell
# Refresh normal feeds, rebuild the combined snapshot, and record metrics.
npm run ops:update

# Run every refresh, including Work inputs and the paid Work/Life model ratings.
npm run ops:update:all

# Run the standard local recalculation stages.
npm run ops:recalculate

# Validate JavaScript, JSON, model runs, local endpoints, and open GitHub Issues/PRs.
npm run ops:check

# Validate files only when the local server/GitHub are unavailable.
npm run ops:check:local

# Inspect open Issues, PRs, and PR check-runs directly.
npm run ops:github

# Upload the current working tree to production, restart only AI Countdown, and check health.
# First create the ignored local deployment config from scripts/deploy.config.example.ps1.
npm run ops:deploy
```

`ops:update:all` is intentionally explicit because Work and Life ratings use OpenRouter and may incur usage costs. For less common combinations, call the PowerShell scripts directly, for example `powershell -File scripts/recalculate.ps1 -Code -SourceFeeds -Snapshot -StartServer`. The Code worker is resumable and keeps its cache/checkpoint files locally; it does not restart from zero after an interrupted run. Production connection details stay in the ignored `deploy.local.md` file.

## GitHub Pages frontend

The static frontend is deployed from `.github/workflows/deploy-pages.yml`. On GitHub Pages, browser API requests are sent to `https://ai.ffnwz.lat`; GitHub tokens and database access remain backend-only.

Create `.env` from `.env.example` and add a local fine-grained GitHub token. Keep the variable name and value private:

```env
GITHUB_TOKEN=github_pat_...
```

Use a fine-grained token with the smallest required permissions. Never commit secrets, `.env`, local caches, analysis locks, or `deploy.local.md`.

## Documentation

- [Concept and editorial rules](CONCEPT.md) · [Русская версия](CONCEPT.ru.md);
- [Current data snapshot](CURRENT-SNAPSHOT.md) · [Русская версия](CURRENT-SNAPSHOT.ru.md);
- [Scanned repository archive](code) — every repository saved by the backend;
- [Methodology](methodology) — bilingual methodology page;
- `deploy.local.md` — private deployment notes, intentionally excluded from the public repository.

## AI building AI dataset

`data/self-building-observations.json` is kept separately from the general editorial observations. It records each company material, the comparable value, source date, scope, exclusions, and the history of the metric.

The current value is the median of comparable public statements about AI-written code inside AI companies' own engineering work:

```text
selfBuild = median(Anthropic 80%, Google 75%, Microsoft midpoint 25%) = 75%
```

OpenAI's 99% AI-output-token figure is retained as an excluded material because it measures token share rather than the share of all code. xAI remains listed as an unavailable comparable percentage. The metric is not a claim that models independently improve themselves: human direction, review, fixes, and release remain outside this number. Each dashboard refresh records the current value in the `selfBuild` field of `data/metric-series.json` or Mongo collection `ai_countdown_metric_series`.

## Life task dataset and methodology

`data/life/life-tasks.json` is the editable register for recurring household and personal-administration work. It includes daily, weekly, monthly, and seasonal tasks, annual occurrences, indicative minutes, and smart-home, software, or robotic mechanisms that may perform part of the task. The list is intentionally explicit so contributors can propose additions or corrections with evidence.

The Life task score is the share of household time AI can take on:

```text
annual workload = occurrences per year × typical minutes × householdShare
Life task observation = weighted mean(task AI capability scores, annual workload)
Life index = median(prototype estimate, Life task observation)
```

`householdShare` is the share of households where the task exists at all (a dog walk only where there is a dog); it is below 1 only for pet- and device-dependent tasks, as an editorial estimate. A weighted median is kept as context: with one task holding a fifth of all minutes it barely moves.

The model rates the complete task, including preparation, loading, unloading, supervision, quality checks, exceptions, and putting things away. A dishwasher or robot vacuum counts only for the part it performs. `refresh-life-tasks.js` rates every task in three passes with seeds 42, 43, 44 and stores the median per task, together with every pass score and the spread, in resumable, hashed runs in `data/life/ratings/`. The dataset hash covers only the fields the model is shown. A run becomes current after it covers at least 90% of the task list.

## Work occupation dataset and methodology

`data/work/` holds the unified classifier (`isco08-occupations.json`, 436 ISCO-08 unit groups keyed by code, English and Russian titles), ILOSTAT employment by sub-major group for the US, Europe, Russia, and Asia (`employment-ilostat.json`), within-group US employment (`isco08-unit-shares.json`: BLS OEWS mapped SOC 2018 → SOC 2010 → ISCO-08 through the O*NET and IBS crosswalks), and one file per rating run in `ratings/`.

```text
occupation score = median of 3 model passes (seeds 42, 43, 44)
occupation observation = median score across occupations (one vote each)
Work index = median(prototype estimate, occupation observation)
```

The model counts software plus a humanoid robot or a quadcopter drone, judged by what today's hardware can do. Occupations are listed by their sub-major group's employment across all regions and, inside a group, by actual US employment; employment-weighted means are reported per region. `node refresh-work-occupations.js inputs|shares|rate|verify` rebuilds the inputs, rates, and checks run files; `verify` also checks that every stored score is the median of its passes.

## Sources and methodology

Code is the median of four compatible percentage sources: AI Code Radar, AI Countdown's own repository analyses (last 12 months, public markers only, a lower bound), the Sonar State of Code 2026 developer survey (AI writes 42% of committed code by self-report), and the detector study by Daniotti et al. (Science, 2026; AI wrote 28.6% of US Python functions at the end of 2024). The last two also see AI used without markers. The Stack Overflow Developer Survey 2026 is kept as context: it measures how many developers use AI daily, not what share of code AI writes. Slop Score is kept as a separate heuristic signal. GitHub AI-contributor data, Bot Commits, `github_explosion`, OSSInsight, company statements, surveys, occupational exposure, and workforce observations provide context and cross-checks; they are not silently averaged into one global percentage.

The dashboard keeps the earlier prototype values as one compatible source for Work and Life while model-rated occupation and everyday-task datasets are established. Company statements and surveys describe different units of observation and must not be treated as direct measurements of replaced human work.

### Source register

The canonical machine-readable registry is [`data/sources.json`](data/sources.json). The page also links the full list under “What is behind the numbers”. The project currently tracks:

- repository and code signals: [Slop Score](https://slopscore.ava.pet/), [Polyphony / slopscore](https://codeberg.org/polyphony/slopscore), [AI Code Radar](https://github.com/Korext/ai-code-radar), [AI Attestation](https://github.com/Korext/ai-attestation), [qmmit](https://www.qmmit.dev/), [Causari Survival](https://causari.dev/reports/survival/), [AI Agent Adoption](https://alteredcraft.github.io/dashboards/ai-agent-adoption/), [Git AI / Grafana](https://grafana.com/grafana/dashboards/25803-git-ai-code-attribution/), [Bot Commits](https://botcommits.dev/), [OSSInsight](https://ossinsight.io/), [GitHub AI Contributors](https://github.com/claude), [github_explosion](https://github.com/edgardomunoznajar/github_explosion), and the [GitHub Contributions API](https://docs.github.com/en/graphql/reference/users);
- work, life, and survey data: [Anthropic Economic Index](https://huggingface.co/datasets/Anthropic/EconomicIndex/tree/main), [Stack Overflow Developer Survey 2026](https://stackoverflow.blog/2026/10/06/the-results-of-the-2026-developer-survey-are-here/), and [Meo AI Workforce Data](https://meoadvisors.com/datasets/);
- company and workforce observations: [OpenAI](https://openai.com/index/how-agents-are-transforming-work/), [Anthropic](https://www.anthropic.com/institute/recursive-self-improvement), [xAI](https://data.x.ai/2025-12-31-xai-frontier-artificial-intelligence-framework.pdf), [Google](https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/cloud-next-2026-sundar-pichai/), [Microsoft](https://techcrunch.com/2025/04/29/microsoft-ceo-says-up-to-30-of-the-companys-code-was-written-by-ai/), [AWS / Amazon](https://assets.aboutamazon.com/bb/2e/9077b9f44a2898c01fcc7f35440d/aws-ai-europe.pdf), [Salesforce](https://www.latimes.com/business/story/2025-09-02/salesforce-ceo-marc-benioff-says-he-cut-4-000-support-roles-because-of-ai), [Klarna](https://www.sec.gov/Archives/edgar/data/2003292/000200329226000007/klar-20251231.htm), and [Amazon workforce](https://apnews.com/article/cb64af47ebb794541fbdfa8fd264932c).

If you find another public source, dataset, company statement, or reproducible method, please propose it in [the GitHub repository](https://github.com/ffnwz/ai). Include the original link, date, sample, denominator, unit, and what the source can or cannot support.

## Contributing

The project is open to evidence-focused contributions. Please use the public [GitHub repository](https://github.com/ffnwz/ai) to suggest:

- methodology changes or clarifications;
- new public sources and datasets;
- corrections to source values, dates, or provenance;
- reproducible improvements to the repository analysis.

Please include a link to the evidence and explain which denominator, time period, and unit of measurement it uses. Open a GitHub issue for discussion or a pull request for a concrete change.

## Limitations

Code measures a public signal of AI participation, not all code in the world. Repository attribution can miss AI used under ordinary human accounts. A commit-level marker does not prove that an agent wrote every changed line. Work and Life task and occupation scores are model capability judgements, not observed adoption; their frequency assumptions and source coverage remain visible.

AI Countdown is intended to make evidence, assumptions, and uncertainty visible. It is not a claim that the project can identify the author of every line or determine the distance to AGI or ASI.

