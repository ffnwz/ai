# AI Countdown — current data snapshot

Snapshot date: **18 October 2026**

The values below describe the prototype state at the time of the snapshot. The live backend can update source freshness and repository measurements after this document was written.

## Dashboard values

| Direction | Value | Interpretation |
| --- | ---: | --- |
| **Code** | **23.1%** | median of AI Code Radar (34.2%, stale snapshot) and AI Countdown repository analyses (11.9%, AI share of AI + human changed lines; automation bots excluded) |
| **Work** | **38%** | median of the 31% prototype value and the ISCO-08 occupation ratings (45%, median of 3 model passes, AI with a humanoid robot or drone) |
| **Life** | **31%** | median of the 24% prototype value and the everyday-task ratings (37.9%, share of household time weighted by annual minutes and household share) |
| **Overall** | **about 30.3%** | demonstration model: `Code × 0.40 + Work × 0.35 + Life × 0.25` |

```text
23.1 × 0.40 + 38 × 0.35 + 31 × 0.25 = 30.3%
```

Snapshot of 19 October 2026, after classification v12 (automation bots separated from human work) and the three-pass Work and Life ratings.

Overall is not a measured global share of replaced human work. Work and Life use transparent model capability observations; household adoption and observed replacement still need separate datasets.

## Code

The saved compatible source is [AI Code Radar](https://oss.korext.com/api/radar/current):

- weighted AI percentage: **34.2%**;
- internal repository median: **28.5%**;
- source snapshot: **16 April 2026**;
- repository coverage: **10,247** listed repositories and **9,151** included in the aggregate;
- covered commits: about **2.85 million**.

The 34.2% value is a weighted public attestation signal, not the literal share of every line of code in the world.

AI Countdown's own repository analyses are stored separately. Each repository contributes one observation to the compatible-source calculation, while the line-weighted value is kept as context.

## Work and Life

Work combines its prototype vote with occupation ratings by the median rule. Life combines its prototype vote with a frequency-and-time-weighted median of recurring household-task ratings. Company statements, developer surveys, occupational exposure, and workforce observations retain their original denominators and are not averaged directly.

Examples of supporting observations include AI output-token usage, reported AI-generated code, developer usage surveys, and occupation-level automation exposure. They measure different things and do not automatically become a delegation percentage.

## Supporting signals

- **Slop Score** is a separate heuristic signal and is not mixed with AI Code Radar's percentage.
- **Bot Commits** and `github_explosion` describe public AI-attributed commit activity, not the exact number of unique projects.
- **GitHub AI Contributors** are a lower-bound monitor because public search and attribution are incomplete.
- **OSSInsight** is a reference layer for public GitHub activity, not a global AI attribution source.
- Repository commit attribution uses a temporal sequence: a recognized agent commit activates the agent for the human author, three agent-free commit days exhaust the sequence, and a different recognized agent switches it immediately.

## Limitations

- Code measures public AI markers and can miss AI used under ordinary human accounts.
- `Co-Authored-By` attribution is commit-level; GitHub does not provide a line-level author split.
- Work and Life are capability estimates with explicit model runs and frequency assumptions; they do not measure household or company adoption.
- Company reports, surveys, layoffs, and occupational exposure cannot be combined without an explicit common methodology.

The combined snapshot is stored in MongoDB (`ai_countdown_state`, key `combined-snapshot`; `data/combined-snapshot-cache.json` only without Mongo). The API endpoint is `GET /api/combined-snapshot`.

