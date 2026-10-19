# AI Countdown

AI Countdown is an open research prototype about how much work AI already takes on.

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
- `data/` contains source registries, classifiers, occupation inputs, and local fallback data;
- MongoDB stores production history, while JSON files keep the standalone server usable;
- GitHub API access stays on the backend. Tokens are never sent to the browser.

## Repository analysis

Visitors can submit a public GitHub repository. The backend:

1. stores the repository and measurement history;
2. returns the first 300 commits quickly;
3. continues the remaining public history in the background;
4. recognizes AI agents from public accounts, emails, and `Co-Authored-By` markers;
5. shows agent and other-contributor shares by changed lines;
6. reuses the saved result for 24 hours before starting another analysis.

When an agent appears in `Co-Authored-By`, the whole commit is assigned to that agent. GitHub does not provide a line-level split between co-authors.

### Top 3 repositories

The Top 3 ranking uses a size-adjusted score:

```text
leaderboard score = AI changed lines × min(1, total changed lines / 10,000)
```

`Total changed lines` means additions plus deletions in the analyzed history. It is not the number of unique lines remaining in the current HEAD. The size adjustment prevents a small repository with 100% AI attribution from automatically outranking a much larger project.

## API

- `GET /api/combined-snapshot` — combined dashboard snapshot;
- `GET /api/metric-series` — historical Code, Work, Life, and Overall values;
- `GET /api/repository-analyses` — saved analyses and the Top 3 ranking;
- `GET /api/repository-analysis?repo=...` — a public repository analysis;
- `POST /api/repository-analysis` — start or resume an analysis;
- `POST /api/contributor-analysis` — inspect a contributor's own repositories;
- `GET /api/source-feeds` — external sources and freshness status.

## Local development

Node.js 20 or newer is recommended.

```powershell
npm start
```

Open `http://127.0.0.1:8765/` after the server starts.

Create `.env` from `.env.example`. The GitHub token variable is:

```env
GITHUB_FFNWZ_API_TOKEN=github_pat_...
```

Use a fine-grained token with the smallest required permissions. Never commit secrets, `.env`, local caches, analysis locks, or `deploy.local.md`.

## Documentation

- [Concept and editorial rules](CONCEPT.md) · [Русская версия](CONCEPT.ru.md);
- [Current data snapshot](CURRENT-SNAPSHOT.md) · [Русская версия](CURRENT-SNAPSHOT.ru.md);
- [Methodology](methodology.html) — bilingual methodology page;
- `deploy.local.md` — private deployment notes, intentionally excluded from the public repository.

## Sources and methodology

Code uses compatible percentage sources, including AI Code Radar and AI Countdown's own repository analyses. Slop Score is kept as a separate heuristic signal. GitHub AI-contributor data, Bot Commits, `github_explosion`, OSSInsight, company statements, surveys, occupational exposure, and workforce observations provide context and cross-checks; they are not silently averaged into one global percentage.

The main dashboard still contains prototype values for Work and Life. Company statements and surveys describe different units of observation and must not be treated as direct measurements of replaced human work.

## Limitations

Code measures a public signal of AI participation, not all code in the world. Repository attribution can miss AI used under ordinary human accounts. A commit-level marker does not prove that an agent wrote every changed line. Work and Life require comparable observed datasets before their prototype values can become measured indices.

AI Countdown is intended to make evidence, assumptions, and uncertainty visible. It is not a claim that the project can identify the author of every line or determine the distance to AGI or ASI.

