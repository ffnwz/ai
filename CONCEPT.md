# AI Countdown — concept and editorial rules

Revision: 19 October 2026.

## Core question

AI Countdown asks: **How much work does AI already do for us?**

The project observes work that AI performs in software development, companies, and everyday life. Every observation should describe the amount of work, the remaining human involvement, the accepted result, the period, and the source.

## Three directions

| Direction | What we observe | Examples |
| --- | --- | --- |
| Code | Which parts of development involve AI and what remains with engineers | writing a change, fixing a bug, running tests, reviewing the result |
| Work | Which work tasks and processes AI performs | answering a customer, processing a document, preparing a report |
| Life | Which personal tasks people hand to AI | drafting a message, finding information, planning a trip |

These are observation areas, not interchangeable measurements. A work email belongs to Work; a personal email belongs to Life. Within a comparable sample, one task is counted once.

## Degrees of delegation

1. **Assistance:** a person performs the task and AI suggests a draft or options.
2. **Task execution:** AI prepares an accepted result while a person sets the conditions and reviews it.
3. **Workflow execution:** AI completes several steps, checks the result, and hands exceptions to a person.
4. **System development:** AI helps improve tools and models that perform later tasks.

The second and third levels can describe delegation of specific manual steps. A claim about replacing an entire workflow requires evidence for all material steps and human interventions. AI helping to build AI is tracked separately and does not by itself prove autonomous self-improvement.

## What a comparable index needs

```text
replaced-work share = comparable manual work completed by AI
                      / total comparable work in the sample
```

The unit of work must be chosen before calculation: for example, comparable support requests or tasks with similar effort. The result also needs a period, sample size, quality threshold, review share, hand-back rate, and human time spent on verification.

Code generation, tool usage, expected adoption, automation potential, and workforce reduction are different observation types. They must not be collapsed into one percentage without a common denominator.

## Current prototype status

- **Code** is a public repository signal. It includes AI assistance and does not measure the share of engineers replaced.
- **Work (31%)** and **Life (24%)** are prototype display values until comparable observed datasets are available.
- **Overall** is a demonstration model: `Code × 0.40 + Work × 0.35 + Life × 0.25`.
- **AI building AI** is a separate evidence track without a current percentage.
- **AGI / ASI** are discussion contexts, not values derived from the dashboard percentage.

Missing data should be shown as unavailable rather than silently replaced by a confident estimate.

## Repository evidence

The backend stores each repository measurement and its history. It analyzes public commit statistics, classifies public AI markers, and distinguishes recognized agents from other contributors. A `Co-Authored-By` agent receives the whole commit because GitHub does not expose a line-level co-author split.

The repository Top 3 uses a size-adjusted score:

```text
AI changed lines × min(1, total changed lines / 10,000)
```

The denominator is additions plus deletions in the analyzed history. It is not unique current source lines. The adjustment prevents a tiny 100%-AI repository from winning solely because of its percentage.

## Editorial voice

Use short, direct sentences and name the observed action. Prefer “AI answered support requests” to vague language such as “agentic transformation of customer experience”. Every observation card should answer:

**What did AI do? → In which sample and period? → What did the person still do? → Where is the source?**

