# AI Countdown — current data snapshot

Snapshot date: **18 October 2026**

The values below describe the prototype state at the time of the snapshot. The live backend can update source freshness and repository measurements after this document was written.

## Dashboard values

| Direction | Value | Interpretation |
| --- | ---: | --- |
| **Code** | **34.2%** | median of compatible sources; the saved AI Code Radar snapshot is stale |
| **Work** | **31%** | prototype display value |
| **Life** | **24%** | prototype display value |
| **Overall** | **about 30.5%** | demonstration model: `Code × 0.40 + Work × 0.35 + Life × 0.25` |

```text
34.2 × 0.40 + 31 × 0.35 + 24 × 0.25 = 30.5%
```

Overall is not a measured global share of replaced human work. Work and Life still need comparable observed datasets.

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

Work and Life are still prototype values. Company statements, developer surveys, occupational exposure, and workforce observations are retained with their original denominators and are not averaged directly.

Examples of supporting observations include AI output-token usage, reported AI-generated code, developer usage surveys, and occupation-level automation exposure. They measure different things and do not automatically become a delegation percentage.

## Supporting signals

- **Slop Score** is a separate heuristic signal and is not mixed with AI Code Radar's percentage.
- **Bot Commits** and `github_explosion` describe public AI-attributed commit activity, not the exact number of unique projects.
- **GitHub AI Contributors** are a lower-bound monitor because public search and attribution are incomplete.
- **OSSInsight** is a reference layer for public GitHub activity, not a global AI attribution source.

## Limitations

- Code measures public AI markers and can miss AI used under ordinary human accounts.
- `Co-Authored-By` attribution is commit-level; GitHub does not provide a line-level author split.
- Work and Life are not yet measured with one comparable denominator.
- Company reports, surveys, layoffs, and occupational exposure cannot be combined without an explicit common methodology.

The raw local snapshot is stored in `data/combined-snapshot-cache.json`. The API endpoint is `GET /api/combined-snapshot`.

