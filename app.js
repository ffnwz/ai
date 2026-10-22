const AI_COUNTDOWN_BACKEND_ORIGIN = 'https://ai.ffnwz.lat';
const IS_GITHUB_PAGES = /(^|\.)github\.io$/i.test(window.location.hostname);
const API_ORIGIN = IS_GITHUB_PAGES ? AI_COUNTDOWN_BACKEND_ORIGIN : '';
const ROUTE_IS_RUSSIAN = /(^|\/)ru\/?$/i.test(window.location.pathname);

function apiUrl(path) {
  return `${API_ORIGIN}${path}`;
}

function configureStaticFrontendLinks() {
  if (!IS_GITHUB_PAGES) return;
  document.querySelectorAll('[data-github-pages-href]').forEach((element) => {
    element.setAttribute('href', element.dataset.githubPagesHref);
  });
}

const translations = {
  "en": {
    "language": "Language",
    "nav": {
      "signals": "signals",
      "model": "model",
      "sources": "sources",
      "robots": "robots"
    },
    "hero": {
      "eyebrow": "TRACKING THE HUMAN WORK AI TAKES ON",
      "title": "How much of life<br /><em>does AI already occupy?</em>",
      "lede": "Code, company workflows, everyday tasks. We track the work AI takes on and how much human involvement remains.",
      "status": "PROTOTYPE · PARTIAL DATA",
      "date": "Version 0.2 · 18 Oct 2026"
    },
    "meter": {
      "copy": "experimental model<br />across three areas",
      "note": "Code is an AI involvement signal from a sample. Work and Life are medians of compatible sources; Life task ratings are weighted by estimated annual minutes.",
      "copyChart": "COPY CHART",
      "copied": "COPIED",
      "copyFallback": "SUMMARY COPIED",
      "shareChart": "SHARE",
      "shared": "SHARED",
      "shareFallback": "LINK COPIED",
      "downloadChart": "DOWNLOAD",
      "downloaded": "DOWNLOADED",
      "center": {
        "code": "CODE",
        "work": "WORK",
        "life": "LIFE",
        "overall": "TOTAL"
      },
      "copyError": "Could not copy. Please try again."
    },
    "data": {
      "loading": "CODE: LOADING DATA…",
      "live": "CODE: SOURCE SNAPSHOT",
      "cached": "CODE: SAVED SNAPSHOT",
      "staleSource": "CODE: OUTDATED SNAPSHOT",
      "auxiliary": "CODE: AUXILIARY HEURISTIC",
      "bootstrap": "CODE: PRELIMINARY SAMPLE",
      "baseline": "CODE: ILLUSTRATIVE VALUE",
      "unavailable": "CODE: SOURCE UNAVAILABLE",
      "median": "Code {value}% is the median of {sources}",
      "single": "Code {value}% · {sources}",
      "sourceJoin": " and ",
      "sourceRadar": "AI Code Radar {value}% ({repos} repos, snapshot {date})",
      "sourceOurs": "our analyses {value}% ({repos} repos)",
      "sourceSurvey": "Sonar developer survey {value}%",
      "sourceStudy": "Daniotti et al. detector {value}% (US, Python, 2024)",
      "barRadar": "AI Code Radar",
      "barOurs": "AI Countdown",
      "barSurvey": "Sonar survey",
      "barStudy": "Daniotti et al.",
      "barMedian": "median",
    },
    "legend": {
      "aria": "Ring legend",
      "code": {
        "label": "Code",
        "help": "What is Code?",
        "tip": "AI involvement in a public code sample, from assistance to generated changes."
      },
      "work": {
        "label": "Work",
        "help": "What is Work?",
        "tip": "Work tasks AI can take on: the median of the prototype estimate and AI ratings of ISCO-08 occupations."
      },
      "life": {
        "label": "Life",
        "help": "What is Life?",
        "tip": "Recurring household tasks AI or smart-home devices can complete: a frequency-and-time-weighted task rating joined by the median rule."
      }
    },
    "code": {
      "title": "01 / CODE",
      "confidence": "example · awaiting data",
      "label": "AI writes and changes code",
      "note": "writing, fixes, tests; people review the result",
      "observed": "sample signal"
    },
    "work": {
      "title": "02 / WORK",
      "confidence": "median of sources",
      "label": "AI carries out work tasks",
      "note": "customer requests, documents, reports",
      "observed": "median of sources",
      "sources": {
        "baseline": "Prototype estimate",
        "occupations": "Occupation ratings"
      }
    },
    "life": {
      "title": "03 / LIFE",
      "confidence": "median of sources",
      "label": "AI takes on everyday tasks",
      "note": "home care, cooking, laundry; devices and people share the workflow",
      "observed": "median of sources",
      "sources": {
        "baseline": "Prototype estimate",
        "tasks": "Everyday task ratings"
      }
    },
    "model": {
      "eyebrow": "WHAT COUNTS AS REPLACEMENT",
      "title": "One task.<br />Or the whole workflow?",
      "copy": "Look at the manual step AI completed and what the person still does: setting the task, checking the result, fixing mistakes, or making a decision.",
      "definitionLabel": "A fully replaced task",
      "definition": "AI takes a specific task through to an accepted result. An estimate needs evidence about quality, review, and cases handed back to a person."
    },
    "detail": {
      "kicker": "WHAT IS HAPPENING IN THIS AREA"
    },
    "selfBuild": {
      "label": "A special case: <b>AI building AI</b>",
      "note": "AI companies and major software developers report how much code AI writes inside their engineering work. The bar is the median of comparable code-share statements, not a measure of autonomous self-improvement.",
      "sources": "Anthropic 80%+ · Google 75% · Microsoft 20–30%",
      "status": "MEDIAN: 75% AI-WRITTEN CODE",
      "statusTemplate": "MEDIAN: {value} AI-WRITTEN CODE",
      "value": "75%",
      "aria": "AI-written code reported by AI companies: 75 percent"
    },
    "reading": {
      "eyebrow": "DEGREE OF REPLACEMENT",
      "title": "What does the person still do?",
      "copy": "A generated answer and a completed workflow replace different amounts of work. Follow each case through to its result.",
      "quoteTitle": "Follow the work from the task to an accepted result.",
      "quoteCopy": "AI may write an answer while a person checks every fact. It may resolve a support request and hand only exceptions to an operator. The remaining human work determines how much has been handed over.",
      "output": "Assistance",
      "outputCopy": "AI suggests an option. A person carries out the task.",
      "adoption": "Task execution",
      "adoptionCopy": "AI prepares the result. A person reviews and accepts it.",
      "autonomy": "Workflow execution",
      "autonomyCopy": "AI completes the steps. A person handles exceptions."
    },
    "roadmap": {
      "eyebrow": "A MAP OF REPLACEMENT",
      "title": "From suggestions to independent work",
      "copy": "The more steps AI completes, the more work it takes on. Use this map to describe an individual case.",
      "footnote": "Different tasks involve different degrees of replacement. AGI, ASI, and autonomous self-improvement require their own criteria and evidence.",
      "stage": {
        "assist": {
          "kicker": "01 / SUGGESTION",
          "title": "Assists",
          "copy": "Suggests text, an answer, or code. A person continues the work."
        },
        "agents": {
          "kicker": "02 / TASK",
          "title": "Executes",
          "copy": "Takes a task and prepares a result for human review."
        },
        "process": {
          "kicker": "03 / WORKFLOW",
          "title": "Runs the workflow",
          "copy": "Completes a sequence of actions, checks results, and escalates exceptions."
        },
        "recursive": {
          "kicker": "04 / DEVELOPMENT",
          "title": "Improves the system",
          "copy": "Helps build tools and models. Its degree of independence needs separate study."
        }
      }
    },
    "sources": {
      "eyebrow": "SOURCES AND OBSERVATIONS",
      "title": "What is behind the numbers",
      "copy": "Repository measurements, surveys, and company reports describe different aspects of replacement. Each source has its own sample, date, and unit of measurement.",
      "registryEyebrow": "SOURCE REGISTRY",
      "registryTitle": "Every source used by the project",
      "registryCopy": "The registry includes live feeds, open datasets, public dashboards, company statements, and cross-checks. Each link keeps its original scope and measurement unit.",
      "methodologyLink": "How the numbers are calculated",
      "occupationsLink": "AI and human share by occupation",
      "lifeTasksLink": "Everyday tasks and devices",
      "robotsLink": "What keeps robots from doing more"
    },
    "contribute": {
      "eyebrow": "OPEN PROJECT",
      "title": "Found a new source?",
      "copy": "Suggest it on GitHub with the link, method, date, sample, and the metric it measures. Methodology changes and data corrections are welcome too.",
      "link": "Suggest a source or change on GitHub"
    },
    "repoAnalysis": {
      "eyebrow": "CHECK A REPOSITORY",
      "title": "Who wrote the code in this repository?",
      "copy": "Enter a public GitHub repository. The backend saves it and compares AI agents with the other contributors.",
      "inputLabel": "Public GitHub repository",
      "placeholder": "https://github.com/owner/repo or https://github.com/user",
      "submit": "ANALYZE REPOSITORY",
      "progressCollecting": "Collecting public commit history…",
      "progressStats": "Checking changed-file statistics…",
      "progressAttribution": "Mapping AI agents and human contributors…",
      "progressQueued": "Another analysis is already running…",
      "progressQueuedNote": "We will show the saved result first and connect to the shared analysis as soon as it is ready.",
      "progressBackground": "Processing the remaining commit history in the background…",
      "progressBackgroundNote": "{processed} of {total} commits processed ({percent}). The statistics update as new pages finish.",
      "recalculating": "LIVE RECALCULATION",
      "progressAverage": "Average analysis time — about {seconds} seconds",
      "progressDone": "Analysis complete",
      "resultEyebrow": "ANALYSIS RESULT",
      "aiChanged": "AI changed lines",
      "totalChanged": "Total changed lines",
      "commits": "AI commits / total",
      "agentsTitle": "AI agents",
      "contributorsTitle": "Other contributors",
      "loading": "ANALYZING PUBLIC COMMIT HISTORY…",
      "resultReceived": "Result received",
      "analysisDuration": "analysis took {seconds}s",
      "live": "Fresh analysis",
      "partial": "Partial history",
      "background": "Background analysis",
      "cached": "Saved result",
      "staleCache": "Previous saved result",
      "unavailable": "Analysis unavailable",
      "window": "last 365 days",
      "allHistory": "all public history",
      "coverage": "stats coverage",
      "noAgents": "No recognized AI-agent commits in the analyzed sample.",
      "noContributors": "No human contributor stats available.",
      "contributionTitle": "Share of changed lines",
      "contributionToggle": "Show contribution statistics",
      "contributionToggleHide": "Hide contribution statistics",
      "contributionMethod": "AI agents fill the scale in sequence, followed by other contributors",
      "others": "Other contributors",
      "noContributionData": "No changed lines available for the scale",
      "changedLines": "changed lines",
      "ofChangedLines": "of all changes",
      "shareOfAllChanges": "percent — share of all changed lines",
      "leaderboardEyebrow": "SAVED HISTORY",
      "leaderboardTitle": "Top 3 repositories by AI contribution",
      "leaderboardCopy": "Ranked by AI-changed lines adjusted for the total volume of changed code in the latest saved measurement.",
      "leaderboardLines": "AI changed lines",
      "leaderboardTotalLines": "total changed lines",
      "leaderboardScore": "weighted score",
      "leaderboardCommits": "AI commits",
      "leaderboardSnapshot": "snapshot",
      "cleanTitle": "Top 3 repositories written by people",
      "cleanCopy": "Active repositories (pushed in the last {days} days) with the most lines changed by people and an AI share of {maxAi}% or less.",
      "cleanLines": "lines by people",
      "cleanAiShare": "AI {share}%",
      "cleanCommits": "commits",
      "cleanPushed": "push",
      "profileEyebrow": "GITHUB PROFILE",
      "profileTitle": "Who writes the code in their own repositories",
      "profileSample": "{repos} own repositories · {commits} own commits · {lines} lines",
      "profileHuman": "@{login} by hand",
      "profileEntryDetail": "{commits} commits · {commitShare}% of commits",
      "profileStatusPrimary": "Main agent: {agent}",
      "profileStatusOccasional": "Uses {agent} sometimes",
      "profileStatusNone": "No AI agents found",
      "profileStatusInsufficient": "Too few own commits",
      "profileStatusUnavailable": "GitHub did not respond",
      "profileRepositories": "Sample",
      "profileNoCommits": "No own commits in the sampled repositories.",
      "profileNote": "Shares are measured on the user's own commits in up to 30 recently pushed repositories they own (30 recent commits each). A recognized agent starts a temporal sequence: up to three agent-free commits on different days remain attributed to it; the next commit is human-owned again. A different agent switches the sequence immediately. AI used without a public marker is not visible.",
      "profileLoading": "ANALYZING THE GITHUB PROFILE…",
      "profileDone": "Profile @{login} analyzed",
      "downloadImage": "Download image",
      "cardRepositoryEyebrow": "AI Countdown · repository check",
      "cardProfileEyebrow": "AI Countdown · GitHub profile check",
      "cardAiLabel": "of changed lines by AI agents",
      "cardProfileAiLabel": "of own code by AI agents",
      "cardLinesOf": "{ai} of {total} lines",
      "cardHumans": "People",
      "cardFooter": "{commits} commits · snapshot {date}",
      "cardProfileFooter": "Own repositories · snapshot {date}",
      "lastCommit": "last commit",
      "attributedAgent": "likely {agent} · {share}% of sampled code in own repositories",
      "favoriteLabel": "favorite agent",
      "favoriteAgent": "{agent} · {share}% of own code",
      "favoriteAgentLow": "{agent} · {share}% of own code · not enough to attribute",
      "favoriteNoAgent": "none found in own repositories",
      "favoriteInsufficient": "too few own commits",
      "favoriteUnavailable": "own repositories not checked",
      "error": "Could not analyze this repository.",
      "rateLimitedUntil": "GitHub API request limit reached. Available again at {time} (in {minutes} min).",
      "rateLimitedSoon": "GitHub API request limit reached. Available again in under a minute.",
      "rateLimited": "GitHub API request limit reached. Please try again later."
    },
    "companies": {
      "eyebrow": "WORK INSIDE COMPANIES",
      "title": "The work companies hand to AI",
      "copy": "Public reports about code, tools, and work tasks. Each card states what its number refers to.",
      "note": "AI code share, token share, and employee expectations measure different things. They remain separate observations and do not change the Work ring."
    },
    "source": {
      "repoLabel": "REPOSITORY SIGNAL",
      "methodLabel": "OPEN METHODOLOGY",
      "companyLabel": "COMPANY SIGNAL",
      "projectLabel": "THIS PROJECT",
      "feedLabel": "SOURCE DATA",
      "datasetLabel": "OPEN DATASET",
      "reportLabel": "RESEARCH REPORT",
      "dashboardLabel": "PUBLIC DASHBOARD",
      "standardLabel": "OPEN STANDARD",
      "surveyLabel": "DEVELOPER SURVEY",
      "contributorsLabel": "GITHUB CONTRIBUTORS",
      "botcommitsLabel": "PUBLIC AI COMMITS",
      "projectCopy": "Tracking the work AI performs for people in code, companies, and everyday life.",
      "projectStatus": "prototype · partial data",
      "radarCopy": "Declarations of AI involvement in code, with sample size and snapshot date.",
      "qmmitCopy": "AI-assisted commits and autonomous changes are tracked separately.",
      "causariCopy": "AI-tagged lines that survive in the repository over time.",
      "agentCopy": "Adoption of agent configuration files across public repositories.",
      "anthropicCopy": "AI task usage split between assistance and automation.",
      "stackCopy": "A developer survey on AI use, trust, and work habits.",
      "meoCopy": "Potential for occupation automation and labor market observations.",
      "gitAiCopy": "Self-hosted line attribution for teams using git-ai.",
      "attestationCopy": "A machine-readable declaration format for AI provenance.",
      "contributorsCopy": "Public repositories and commits involving AI-linked GitHub accounts such as Claude.",
      "botcommitsCopy": "Monthly estimate of public commits attributed to AI coding tools.",
      "ossInsightCopy": "Independent GitHub statistics for repositories, commits, pull requests, and contributors.",
      "explosionCopy": "A collector and analysis pipeline for AI-attributed commit series using GH Archive and GitHub Search.",
      "contributorsLoading": "Loading contributor data…",
      "feedLoading": "Loading data…",
      "feedUnavailable": "Data unavailable",
      "liveStatus": "source snapshot",
      "staleStatus": "outdated snapshot",
      "cacheStatus": "saved snapshot"
    },
    "company": {
      "openai": {
        "kind": "INTERNAL WORK",
        "metric": "of an average engineer’s AI output tokens via Codex",
        "copy": "In its June 25, 2026 report, OpenAI says an average engineer generates 99% of their AI output tokens through Codex. This measures tool usage relative to ChatGPT.",
        "source": "OpenAI report"
      },
      "anthropic": {
        "kind": "INTERNAL CODE",
        "metric": "of code merged into the codebase authored by Claude",
        "copy": "Anthropic reports that Claude authored over 80% of the code merged into its codebase by May 2026. Engineers direct the work and review changes.",
        "source": "Anthropic research"
      },
      "xai": {
        "kind": "DATA NOT DISCLOSED",
        "metric": "internal AI work share not published",
        "copy": "xAI says it plans to measure internal AI use, but has not published a specific share of code or replaced work.",
        "source": "xAI framework"
      },
      "google": {
        "kind": "INTERNAL CODE",
        "metric": "of new code AI-generated and reviewed by engineers",
        "copy": "Google put this share at 75% in its April 22, 2026 update. Engineer review is part of the reported process.",
        "source": "Google report"
      },
      "microsoft": {
        "kind": "CEO STATEMENT",
        "metric": "of code in some projects",
        "copy": "Satya Nadella described 20–30% of code in some Microsoft repositories as written by software, with scope varying by language and project.",
        "source": "CEO statement coverage"
      },
      "amazon": {
        "kind": "AWS SURVEY",
        "metric": "of respondents expect to use AI by 2028",
        "copy": "In an AWS survey of over 6,500 employees in Europe, 81% expected to use AI at work by 2028. This figure records participants’ expectations.",
        "source": "AWS survey"
      }
    },
    "workforce": {
      "eyebrow": "TASKS AND JOBS",
      "title": "How people’s work changes",
      "copy": "As AI takes on more tasks, workloads and team structures change. Here we collect reports about staffing and the volume of work AI handles.",
      "note": "Each case keeps its period, team size, and type of claim. A company may attribute a reduction to AI, or the connection may remain unclear.",
      "salesforce": {
        "kind": "CEO ATTRIBUTES REDUCTION TO AI",
        "metric": "reduction in support headcount",
        "copy": "The CEO reported a support headcount reduction from about 9,000 to 5,000 and linked it to AI agents. The 44% is calculated against that team’s headcount.",
        "source": "CEO statement coverage"
      },
      "klarna": {
        "kind": "REPORTED AI WORK VOLUME",
        "metric": "full-time support agent equivalents",
        "copy": "Klarna estimated its assistant’s work as equivalent to more than 700 full-time support agents. This describes work volume; a staffing conclusion requires separate evidence.",
        "source": "Klarna annual report"
      },
      "amazon": {
        "kind": "MULTIPLE REASONS FOR CUTS",
        "metric": "reduction in corporate workforce",
        "copy": "About 14,000 announced cuts against an estimated 350,000 corporate staff. The company discussed AI and structural changes; the share of cuts caused by AI is not established.",
        "source": "workforce report"
      }
    },
    "questions": {
      "ownershipTitle": "AI wrote the code. Which work did it replace?",
      "ownershipCopy": "Writing code is one step in development. Specification, review, testing, and release may still involve people. Assessing workflow replacement requires evidence about those steps.",
      "selfTitle": "What do the ring percentages mean?",
      "selfCopy": "Code is an AI involvement signal from an available repository sample. Work and Life are medians of compatible sources; Life uses recurring task ratings weighted by annual workload. Their weighted combination is labeled “Model.” There is no measured overall replacement share yet.",
      "claimTitle": "When can we say AI replaced an employee?",
      "claimCopy": "That requires evidence about roles, team size, the period, and the reasons for change. Work volume in employee equivalents and generated code percentages do not establish it on their own."
    },
    "footer": {
      "left": "tracking the work AI takes on",
      "right": "Prototype: Code is a sample signal; Work and Life are medians of sources. Life uses an explicit household-task dataset. Methodology and sources are open.",
      "github": "Source code and suggestions on GitHub"
    },
    "aria": {
      "rings": "AI involvement in code, work, and recurring everyday tasks"
    },
    "states": {
      "code": {
        "title": "AI creates code. Who takes it through to release?",
        "copy": "Repository signals show AI involvement in changes. Assessing replaced work also requires evidence about review, fixes, and release. The current percentage refers to the source sample."
      },
      "work": {
        "title": "From a customer reply to a completed workflow.",
        "copy": "AI can prepare an answer, process a document, or compile a report. Replacement depends on the steps completed and how often a person intervenes. Work is the median of the 31% prototype estimate and AI ratings of 436 ISCO-08 occupations from 0 (AI cannot help) to 100 (AI works without a person)."
      },
      "life": {
        "title": "Messages, search, plans: which tasks does AI complete?",
        "copy": "We look at the personal tasks AI takes through to a useful result and what people still do themselves. An overall estimate needs evidence about recurring use and review. The 24% currently illustrates the scale."
      }
    },
    "meta": {
      "title": "AI Countdown — how much of life does AI already occupy?",
      "description": "Track how much of life AI already occupies across code, company workflows, and everyday tasks. Sources, company reports, and the scope of each estimate."
    }
  },
  "ru": {
    "language": "Язык",
    "nav": {
      "signals": "сигналы",
      "model": "модель",
      "sources": "источники",
      "robots": "роботы"
    },
    "hero": {
      "eyebrow": "ЗАМЕЩЕНИЕ ЧЕЛОВЕЧЕСКОЙ РАБОТЫ",
      "title": "Какую часть жизни<br /><em>уже занимает AI?</em>",
      "lede": "Код, рабочие процессы, повседневные задачи. Следим за тем, какую работу AI берёт на себя и сколько участия человека остаётся.",
      "status": "ПРОТОТИП · НЕПОЛНЫЕ ДАННЫЕ",
      "date": "Версия 0.2 · 18 окт. 2026"
    },
    "meter": {
      "copy": "экспериментальная модель<br />по трём направлениям",
      "note": "Код — сигнал участия AI в выборке. Работа и Жизнь считаются медианой совместимых источников; для бытовых дел частота переводится в годовую нагрузку.",
      "copyChart": "СКОПИРОВАТЬ ГРАФИК",
      "copied": "СКОПИРОВАНО",
      "copyFallback": "СВОДКА СКОПИРОВАНА",
      "shareChart": "ПОДЕЛИТЬСЯ",
      "shared": "ОТПРАВЛЕНО",
      "shareFallback": "ССЫЛКА СКОПИРОВАНА",
      "downloadChart": "СКАЧАТЬ ГРАФИК",
      "downloaded": "СКАЧАНО",
      "center": {
        "code": "КОД",
        "work": "РАБОТА",
        "life": "ЖИЗНЬ",
        "overall": "ИТОГО"
      },
      "copyError": "Не удалось скопировать. Попробуйте ещё раз."
    },
    "data": {
      "loading": "КОД: ЗАГРУЖАЕМ ДАННЫЕ…",
      "live": "КОД: СНИМОК ИСТОЧНИКА",
      "cached": "КОД: СОХРАНЁННЫЕ ДАННЫЕ",
      "staleSource": "КОД: УСТАРЕВШИЙ СНИМОК",
      "auxiliary": "КОД: ВСПОМОГАТЕЛЬНАЯ ЭВРИСТИКА",
      "bootstrap": "КОД: ПРЕДВАРИТЕЛЬНАЯ ВЫБОРКА",
      "baseline": "КОД: УСЛОВНОЕ ЗНАЧЕНИЕ",
      "unavailable": "КОД: ИСТОЧНИК НЕДОСТУПЕН",
      "median": "Код {value}% — медиана: {sources}",
      "single": "Код {value}% · {sources}",
      "sourceJoin": " и ",
      "sourceRadar": "AI Code Radar {value}% ({repos} репо, снимок {date})",
      "sourceOurs": "наши анализы {value}% ({repos} репо)",
      "sourceSurvey": "опрос разработчиков Sonar {value}%",
      "sourceStudy": "детектор Daniotti et al. {value}% (США, Python, 2024)",
      "barRadar": "AI Code Radar",
      "barOurs": "AI Countdown",
      "barSurvey": "опрос Sonar",
      "barStudy": "Daniotti et al.",
      "barMedian": "медиана",
    },
    "legend": {
      "aria": "Легенда колец",
      "code": {
        "label": "Код",
        "help": "Что означает кольцо «Код»?",
        "tip": "Участие AI в публичной выборке кода: от помощи до генерации изменений."
      },
      "work": {
        "label": "Работа",
        "help": "Что означает кольцо «Работа»?",
        "tip": "Рабочие задачи, которые может взять на себя AI: медиана оценки прототипа и AI-оценки профессий ISCO-08."
      },
      "life": {
        "label": "Жизнь",
        "help": "Что означает кольцо «Жизнь»?",
        "tip": "Повседневные задачи дома: оценки AI и умных устройств, взвешенные по частоте и типичной годовой нагрузке, затем объединённые медианой."
      }
    },
    "code": {
      "title": "01 / КОД",
      "confidence": "пример · до загрузки данных",
      "label": "AI пишет и меняет код",
      "note": "написание, исправления, тесты; человек проверяет результат",
      "observed": "сигнал в выборке"
    },
    "work": {
      "title": "02 / РАБОТА",
      "confidence": "медиана источников",
      "label": "AI выполняет рабочие задачи",
      "note": "обращения клиентов, документы, отчёты",
      "observed": "медиана источников",
      "sources": {
        "baseline": "Оценка прототипа",
        "occupations": "Оценка профессий"
      }
    },
    "life": {
      "title": "03 / ЖИЗНЬ",
      "confidence": "медиана источников",
      "label": "AI берёт на себя повседневные дела",
      "note": "уборка, готовка, стирка; устройства и человек делят процесс",
      "observed": "медиана источников",
      "sources": {
        "baseline": "Прототипная оценка",
        "tasks": "Оценки бытовых задач"
      }
    },
    "model": {
      "eyebrow": "ЧТО СЧИТАЕМ ЗАМЕЩЕНИЕМ",
      "title": "Отдельная задача.<br />Или уже целый процесс?",
      "copy": "Важно понять, какой ручной этап AI выполнил и что осталось человеку: поставить задачу, проверить результат, исправить ошибки или принять решение.",
      "definitionLabel": "Полное замещение задачи",
      "definition": "AI доводит конкретную задачу до принятого результата. Для оценки нужны данные о качестве, проверке и случаях, когда работу пришлось вернуть человеку."
    },
    "detail": {
      "kicker": "ЧТО ПРОИСХОДИТ В ЭТОМ НАПРАВЛЕНИИ"
    },
    "selfBuild": {
      "label": "Особый случай: <b>AI создаёт AI</b>",
      "note": "AI-компании и крупные разработчики сообщают, какую долю кода AI пишет внутри их инженерной работы. Бар показывает медиану сопоставимых заявлений о доле кода, а не самостоятельное саморазвитие.",
      "sources": "Anthropic 80%+ · Google 75% · Microsoft 20–30%",
      "status": "МЕДИАНА: 75% AI-КОДА",
      "statusTemplate": "МЕДИАНА: {value} AI-КОДА",
      "value": "75%",
      "aria": "По заявлениям AI-компаний, AI пишет 75 процентов кода внутри их разработки"
    },
    "reading": {
      "eyebrow": "СТЕПЕНЬ ЗАМЕЩЕНИЯ",
      "title": "Что именно осталось человеку?",
      "copy": "Один сгенерированный ответ и самостоятельно выполненный процесс означают разный объём замещённой работы. Для каждого случая смотрим на весь путь до результата.",
      "quoteTitle": "Важен весь путь: от задачи до принятого результата.",
      "quoteCopy": "AI может написать ответ, а человек — проверить каждый факт. Может закрыть обращение целиком и передать оператору только исключения. Объём участия человека определяет, сколько работы удалось передать.",
      "output": "Помощь",
      "outputCopy": "AI предлагает вариант. Человек выполняет задачу.",
      "adoption": "Выполнение задачи",
      "adoptionCopy": "AI готовит результат. Человек проверяет и принимает.",
      "autonomy": "Выполнение процесса",
      "autonomyCopy": "AI проходит этапы сам. Человек разбирает исключения."
    },
    "roadmap": {
      "eyebrow": "КАРТА ЗАМЕЩЕНИЯ",
      "title": "От подсказки к самостоятельной работе",
      "copy": "Чем больше этапов AI доводит до результата, тем больше работы он берёт на себя. Эта карта помогает описать отдельный случай.",
      "footnote": "У разных задач разная степень замещения. Для AGI, ASI и автономного саморазвития нужны отдельные критерии и свидетельства.",
      "stage": {
        "assist": {
          "kicker": "01 / ПОДСКАЗКА",
          "title": "Помогает",
          "copy": "Предлагает текст, ответ или фрагмент кода. Дальше работает человек."
        },
        "agents": {
          "kicker": "02 / ЗАДАЧА",
          "title": "Выполняет",
          "copy": "Получает задачу и готовит результат для проверки человеком."
        },
        "process": {
          "kicker": "03 / ПРОЦЕСС",
          "title": "Ведёт процесс",
          "copy": "Выполняет цепочку действий, проверяет результат, передаёт исключения."
        },
        "recursive": {
          "kicker": "04 / РАЗВИТИЕ",
          "title": "Улучшает систему",
          "copy": "Участвует в создании инструментов и моделей. Степень самостоятельности исследуется отдельно."
        }
      }
    },
    "sources": {
      "eyebrow": "ИСТОЧНИКИ И НАБЛЮДЕНИЯ",
      "title": "Что стоит за числами",
      "copy": "Измерения репозиториев, опросы и заявления компаний описывают разные стороны замещения. У каждого источника — своя выборка, дата и единица измерения.",
      "registryEyebrow": "РЕЕСТР ИСТОЧНИКОВ",
      "registryTitle": "Все источники проекта",
      "registryCopy": "В реестре собраны live feeds, открытые датасеты, публичные дашборды, заявления компаний и источники для перепроверки. У каждой ссылки сохранены исходный охват и единица измерения.",
      "methodologyLink": "Как считаются показатели",
      "occupationsLink": "Доля AI и человека по профессиям",
      "lifeTasksLink": "Повседневные задачи и устройства",
      "robotsLink": "Что мешает роботам"
    },
    "contribute": {
      "eyebrow": "ОТКРЫТЫЙ ПРОЕКТ",
      "title": "Нашли новый источник?",
      "copy": "Предложите его на GitHub: добавьте ссылку, методику, дату, выборку и объяснение, какой показатель он измеряет. Также принимаем изменения методологии и исправления данных.",
      "link": "Предложить источник или изменение на GitHub"
    },
    "repoAnalysis": {
      "eyebrow": "ПРОВЕРИТЬ РЕПОЗИТОРИЙ",
      "title": "Кто написал код в этом репозитории?",
      "copy": "Введите публичный GitHub-репозиторий. Backend сохранит его и сравнит AI-агентов с остальными контрибьюторами.",
      "inputLabel": "Публичный репозиторий GitHub",
      "placeholder": "https://github.com/owner/repo или https://github.com/user",
      "submit": "ПРОАНАЛИЗИРОВАТЬ",
      "progressCollecting": "Собираем публичную историю коммитов…",
      "progressStats": "Проверяем статистику изменённых файлов…",
      "progressAttribution": "Распределяем вклад AI-агентов и людей…",
      "progressQueued": "Этот репозиторий уже анализируется…",
      "progressQueuedNote": "Показываем сохранённый результат и подключимся к общему анализу, когда он будет готов.",
      "progressBackground": "Догружаем остальные коммиты в фоне…",
      "progressBackgroundNote": "Обработано {processed} из {total} коммитов ({percent}). Статистика обновляется после каждой страницы.",
      "recalculating": "ПЕРЕСЧЁТ ОНЛАЙН",
      "progressAverage": "Среднее время анализа — около {seconds} секунд",
      "progressDone": "Анализ завершён",
      "resultEyebrow": "РЕЗУЛЬТАТ АНАЛИЗА",
      "aiChanged": "AI изменил строк",
      "totalChanged": "Всего изменено строк",
      "commits": "Коммиты AI / всего",
      "agentsTitle": "AI-агенты",
      "contributorsTitle": "Другие контрибьюторы",
      "loading": "АНАЛИЗИРУЕМ ПУБЛИЧНУЮ ИСТОРИЮ КОММИТОВ…",
      "resultReceived": "Результат получен",
      "analysisDuration": "анализ занял {seconds} с",
      "live": "Свежий анализ",
      "partial": "История обработана частично",
      "background": "Анализ продолжается в фоне",
      "cached": "Сохранённый результат",
      "staleCache": "Предыдущий сохранённый результат",
      "unavailable": "Анализ недоступен",
      "window": "последние 365 дней",
      "allHistory": "вся публичная история",
      "coverage": "охват статистики",
      "noAgents": "В обработанной выборке не найдено распознанных коммитов AI-агентов.",
      "noContributors": "Статистика человеческих контрибьюторов недоступна.",
      "contributionTitle": "Доля по изменённым строкам",
      "contributionToggle": "Показать статистику вклада",
      "contributionToggleHide": "Скрыть статистику вклада",
      "contributionMethod": "AI-агенты заполняются по очереди, затем остальные контрибьюторы",
      "others": "Остальные контрибьюторы",
      "noContributionData": "Нет изменённых строк для шкалы",
      "changedLines": "изменённых строк",
      "ofChangedLines": "от всех изменений",
      "shareOfAllChanges": "процент — доля от всех изменённых строк",
      "leaderboardEyebrow": "СОХРАНЁННАЯ ИСТОРИЯ",
      "leaderboardTitle": "Топ-3 репозитория по вкладу AI",
      "leaderboardCopy": "Рейтинг учитывает строки, изменённые AI, и общий объём изменённого кода в последнем сохранённом замере.",
      "leaderboardLines": "AI изменил строк",
      "leaderboardTotalLines": "всего изменённых строк",
      "leaderboardScore": "взвешенный вклад",
      "leaderboardCommits": "AI-коммитов",
      "leaderboardSnapshot": "снимок",
      "cleanTitle": "Топ-3 репозитория, которые пишут люди",
      "cleanCopy": "Активные репозитории (push за последние {days} дней), где люди изменили больше всего строк, а доля AI не выше {maxAi}%.",
      "cleanLines": "строк изменили люди",
      "cleanAiShare": "AI {share}%",
      "cleanCommits": "коммитов",
      "cleanPushed": "push",
      "profileEyebrow": "ПРОФИЛЬ GITHUB",
      "profileTitle": "Кто пишет код в своих репозиториях",
      "profileSample": "{repos} своих репозиториев · {commits} своих коммитов · {lines} строк",
      "profileHuman": "@{login} сам",
      "profileEntryDetail": "{commits} комм. · {commitShare}% коммитов",
      "profileStatusPrimary": "Основной агент: {agent}",
      "profileStatusOccasional": "Иногда использует {agent}",
      "profileStatusNone": "AI-агенты не найдены",
      "profileStatusInsufficient": "Мало своих коммитов",
      "profileStatusUnavailable": "GitHub не ответил",
      "profileRepositories": "Выборка",
      "profileNoCommits": "В выбранных репозиториях нет собственных коммитов.",
      "profileNote": "Доли считаются по собственным коммитам пользователя в 30 последних по push собственных репозиториях (до 30 последних коммитов в каждом). Распознанный агент запускает временную последовательность: до трёх безагентных коммитов в разные дни всё ещё относятся к нему, следующий коммит снова считается собственным. Другой агент сразу переключает последовательность. AI без публичного маркера не виден.",
      "profileLoading": "АНАЛИЗИРУЕМ ПРОФИЛЬ GITHUB…",
      "profileDone": "Профиль @{login} проанализирован",
      "downloadImage": "Скачать картинку",
      "cardRepositoryEyebrow": "AI Countdown · проверка репозитория",
      "cardProfileEyebrow": "AI Countdown · проверка профиля GitHub",
      "cardAiLabel": "изменённых строк — AI-агенты",
      "cardProfileAiLabel": "своего кода — AI-агенты",
      "cardLinesOf": "{ai} из {total} строк",
      "cardHumans": "Люди",
      "cardFooter": "{commits} коммитов · снимок {date}",
      "cardProfileFooter": "Собственные репозитории · снимок {date}",
      "lastCommit": "последний коммит",
      "attributedAgent": "вероятно {agent} · {share}% кода в собственных репозиториях",
      "favoriteLabel": "любимый агент",
      "favoriteAgent": "{agent} · {share}% своего кода",
      "favoriteAgentLow": "{agent} · {share}% своего кода · мало для атрибуции",
      "favoriteNoAgent": "не найден в своих репозиториях",
      "favoriteInsufficient": "мало собственных коммитов",
      "favoriteUnavailable": "свои репозитории не проверены",
      "error": "Не удалось проанализировать этот репозиторий.",
      "rateLimitedUntil": "Лимит запросов к GitHub API исчерпан. Снова будет доступно в {time} (через {minutes} мин).",
      "rateLimitedSoon": "Лимит запросов к GitHub API исчерпан. Снова будет доступно меньше чем через минуту.",
      "rateLimited": "Лимит запросов к GitHub API исчерпан. Попробуйте позже."
    },
    "companies": {
      "eyebrow": "РАБОТА ВНУТРИ КОМПАНИЙ",
      "title": "Какую работу компании поручают AI",
      "copy": "Публичные заявления о коде, инструментах и рабочих задачах. На каждой карточке указано, к чему относится число.",
      "note": "Доля AI-кода, доля токенов и ожидания сотрудников измеряют разные вещи. Эти значения показываем отдельно; они не меняют кольцо «Работа»."
    },
    "source": {
      "repoLabel": "СИГНАЛ РЕПОЗИТОРИЕВ",
      "methodLabel": "ОТКРЫТАЯ МЕТОДОЛОГИЯ",
      "companyLabel": "СИГНАЛ КОМПАНИИ",
      "projectLabel": "ЭТОТ ПРОЕКТ",
      "feedLabel": "ДАННЫЕ ИСТОЧНИКА",
      "datasetLabel": "ОТКРЫТЫЕ ДАННЫЕ",
      "reportLabel": "ИССЛЕДОВАТЕЛЬСКИЙ ОТЧЁТ",
      "dashboardLabel": "ПУБЛИЧНЫЙ ДАШБОРД",
      "standardLabel": "ОТКРЫТЫЙ СТАНДАРТ",
      "surveyLabel": "ОПРОС РАЗРАБОТЧИКОВ",
      "contributorsLabel": "GITHUB-КОНТРИБЬЮТОРЫ",
      "botcommitsLabel": "ПУБЛИЧНЫЕ AI-КОММИТЫ",
      "projectCopy": "Следим за тем, какую работу AI выполняет вместо человека — в коде, компаниях и повседневных делах.",
      "projectStatus": "прототип · данные собраны частично",
      "radarCopy": "Декларации об участии AI в коде с размером выборки и датой снимка.",
      "qmmitCopy": "Коммиты с помощью AI и автономные изменения учитываются отдельно.",
      "causariCopy": "AI-помеченные строки, которые пережили дальнейшие изменения.",
      "agentCopy": "Распространённость конфигураций агентов в публичных репозиториях.",
      "anthropicCopy": "Использование AI в задачах: помощь человеку и автоматическое выполнение.",
      "stackCopy": "Опрос разработчиков об использовании AI, доверии и рабочих привычках.",
      "meoCopy": "Потенциал автоматизации профессий и наблюдения о рынке труда.",
      "gitAiCopy": "Учёт строк, созданных с участием AI, в отдельных командах.",
      "attestationCopy": "Машиночитаемый формат декларации происхождения кода.",
      "contributorsCopy": "Публичные репозитории и коммиты AI-связанных GitHub-аккаунтов, например Claude.",
      "botcommitsCopy": "Помесячная оценка публичных коммитов, атрибутированных AI-инструментам.",
      "ossInsightCopy": "Независимая статистика GitHub: репозитории, коммиты, PR и контрибьюторы для проверки масштаба.",
      "explosionCopy": "Сборщик и анализ рядов AI-атрибутированных коммитов через GH Archive и GitHub Search.",
      "contributorsLoading": "Загружаем данные контрибьюторов…",
      "feedLoading": "Загружаем данные…",
      "feedUnavailable": "Данные недоступны",
      "liveStatus": "снимок источника",
      "staleStatus": "устаревший снимок",
      "cacheStatus": "сохранённый снимок"
    },
    "company": {
      "openai": {
        "kind": "ВНУТРЕННЯЯ РАБОТА",
        "metric": "токенов AI-ответов среднего инженера — через Codex",
        "copy": "По отчёту OpenAI от 25 июня 2026, средний инженер получает через Codex 99% токенов своих AI-ответов. Это доля использования инструмента в сравнении с ChatGPT.",
        "source": "отчёт OpenAI"
      },
      "anthropic": {
        "kind": "ВНУТРЕННИЙ КОД",
        "metric": "кода, включённого в кодовую базу, написал Claude",
        "copy": "Anthropic сообщает: к маю 2026 Claude писал более 80% кода, включённого в кодовую базу компании. Инженеры направляют работу и проверяют изменения.",
        "source": "исследование Anthropic"
      },
      "xai": {
        "kind": "ДАННЫЕ НЕ РАСКРЫТЫ",
        "metric": "доля внутренней работы AI не опубликована",
        "copy": "xAI сообщает о планах измерять внутреннее использование AI, но конкретная доля кода или замещённой работы пока не раскрыта.",
        "source": "документ xAI"
      },
      "google": {
        "kind": "ВНУТРЕННИЙ КОД",
        "metric": "нового кода создано AI и проверено инженерами",
        "copy": "В сообщении от 22 апреля 2026 Google оценивает эту долю в 75%. Проверка инженерами входит в описанный процесс.",
        "source": "отчёт Google"
      },
      "microsoft": {
        "kind": "ЗАЯВЛЕНИЕ CEO",
        "metric": "кода в отдельных проектах",
        "copy": "В заявлении Сатьи Наделлы доля кода, написанного AI, оценивается в 20–30% для отдельных проектов Microsoft. Она зависит от языка и проекта.",
        "source": "публикация о заявлении CEO"
      },
      "amazon": {
        "kind": "ОПРОС AWS",
        "metric": "опрошенных ожидают использовать AI к 2028 году",
        "copy": "В опросе AWS более 6500 сотрудников в Европе 81% ожидали использовать AI на работе к 2028 году. Показатель отражает ожидания участников.",
        "source": "опрос AWS"
      }
    },
    "workforce": {
      "eyebrow": "ЗАДАЧИ И РАБОЧИЕ МЕСТА",
      "title": "Как меняется работа людей",
      "copy": "Когда AI выполняет больше задач, меняются нагрузка и состав команд. Здесь собираем сообщения о сокращениях и объёме работы AI.",
      "note": "Для каждого случая сохраняем период, размер команды и характер заявления. Связь сокращения с AI может быть заявлена компанией или оставаться неясной.",
      "salesforce": {
        "kind": "CEO СВЯЗАЛ СОКРАЩЕНИЕ С AI",
        "metric": "сокращение численности поддержки",
        "copy": "По заявлению CEO, штат поддержки сократился примерно с 9000 до 5000 человек; он связал это с AI-агентами. 44% рассчитаны от численности этой команды.",
        "source": "публикация о заявлении CEO"
      },
      "klarna": {
        "kind": "ЗАЯВЛЕННЫЙ ОБЪЁМ РАБОТЫ AI",
        "metric": "эквивалент полной занятости в поддержке",
        "copy": "Klarna оценивала работу ассистента как эквивалент более 700 сотрудников поддержки с полной занятостью. Такая оценка описывает объём работы; для вывода о сокращении штата нужны отдельные данные.",
        "source": "годовой отчёт Klarna"
      },
      "amazon": {
        "kind": "НЕСКОЛЬКО ПРИЧИН СОКРАЩЕНИЯ",
        "metric": "сокращение корпоративного штата",
        "copy": "Около 14 000 объявленных сокращений при оценке корпоративного штата в 350 000 человек. Компания обсуждала AI и изменения структуры; доля сокращений, вызванных AI, не установлена.",
        "source": "отчёт о штате"
      }
    },
    "questions": {
      "ownershipTitle": "AI написал код. Какую работу он заменил?",
      "ownershipCopy": "Создание кода — один этап разработки. Постановка задачи, проверка, тестирование и выпуск могут оставаться за человеком. Для оценки замещения процесса нужны данные об этих этапах.",
      "selfTitle": "Что означают проценты в кольцах?",
      "selfCopy": "Код показывает сигнал участия AI в доступной выборке репозиториев. Работа и Жизнь — медианы совместимых источников; для Жизни оцениваются повторяющиеся бытовые задачи с весом годовой нагрузки. Общее число объединяет их по выбранным весам и подписано «Модель». Измеренной общей доли замещения пока нет.",
      "claimTitle": "Когда можно сказать, что AI заменил сотрудника?",
      "claimCopy": "Для такого вывода нужны данные о должностях, численности команды, периоде и причинах изменений. Объём работы в эквиваленте сотрудников и процент сгенерированного кода сами по себе такого вывода не дают."
    },
    "footer": {
      "left": "наблюдаем за замещением человеческой работы",
      "right": "Прототип: Код — сигнал в выборке; Работа и Жизнь — медианы источников. Для Жизни есть отдельный реестр бытовых задач. Методология и источники открыты.",
      "github": "Исходный код и предложения на GitHub"
    },
    "aria": {
      "rings": "Участие AI в коде и работе и условный показатель жизни"
    },
    "states": {
      "code": {
        "title": "AI создаёт код. Кто доводит его до выпуска?",
        "copy": "Сигнал из репозиториев показывает участие AI в создании изменений. Чтобы понять объём замещённой работы, нужны также данные о проверке, исправлениях и выпуске. Текущий процент относится к выборке источника."
      },
      "work": {
        "title": "От ответа клиенту до выполненного процесса.",
        "copy": "AI может подготовить ответ, обработать документ или собрать отчёт. Замещение зависит от того, сколько этапов он завершает и как часто нужна помощь человека. Работа — медиана условных 31% прототипа и AI-оценки 436 профессий ISCO-08 от 0 (AI не может помочь) до 100 (AI работает без человека)."
      },
      "life": {
        "title": "Письма, поиск, планы: какие дела уже выполняет AI?",
        "copy": "Смотрим, какие личные задачи AI доводит до полезного результата и что человек делает сам. Для общей оценки нужны данные о регулярном использовании и проверке. 24% пока показывают только пример шкалы."
      }
    },
    "meta": {
      "title": "AI Countdown — какую часть жизни уже занимает AI?",
      "description": "Оценка того, какую часть жизни уже занимает AI: код, рабочие процессы и повседневная жизнь на основе открытых источников и методологии."
    }
  }
};

let currentLocale = 'ru';
let activeSignal = 'code';
let lastSlopPayload = null;
let lastCombinedSnapshot = null;
let lastSourceFeeds = null;
let lastGithubContributors = null;
let lastRepositoryAnalysis = null;
let lastRepositoryAnalysisLeaderboard = [];
let lastRepositoryCleanLeaderboard = { items: [], criteria: null };
let lastContributorAnalysis = null;
let repositoryContributionOpen = true;
let repositoryAnalysisProgressTimer = null;
let repositoryAnalysisProgressStartedAt = 0;
let repositoryAnalysisBackgroundTimer = null;
let repositoryAnalysisBackgroundRepo = '';
let repositoryAnalysisBackgroundInFlight = false;
let pendingCodeValue = null;
let centerMode = 'overall';
let introSequenceRunning = false;
let centerCounterFrame = 0;
let introSequenceId = 0;
const INITIAL_RING_VALUES = { code: 42, work: 31, life: 24 };
let currentWorkValue = INITIAL_RING_VALUES.work;
let currentLifeValue = INITIAL_RING_VALUES.life;
let lastWorkIndex = null;
let lastLifeIndex = null;
const INTRO_RING_DURATION = 5000;
const INTRO_RING_GAP = 400;
const REPOSITORY_ANALYSIS_DEFAULT_ESTIMATE_MS = 12_000;
const REPOSITORY_ANALYSIS_TIMING_STORAGE_KEY = 'ai-countdown-repository-analysis-timings';
const REPOSITORY_ANALYSIS_LEADERBOARD_REFERENCE_LINES = 10_000;

function setSignalIntroState({ pending = false, revealed = [] } = {}) {
  const signals = document.querySelector('.signals');
  const legend = document.querySelector('.ring-legend');
  const meterNote = document.querySelector('.meter-note');
  const copyButton = document.querySelector('#copy-chart');
  const shareButton = document.querySelector('#share-chart');
  const downloadButton = document.querySelector('#download-chart');
  const signalButtons = document.querySelectorAll('.signal');
  const legendItems = document.querySelectorAll('.legend-item[data-signal]');
  signals?.classList.toggle('intro-pending', pending);
  legend?.classList.toggle('intro-pending', pending);
  meterNote?.classList.toggle('intro-pending', pending);
  copyButton?.classList.toggle('intro-pending', pending);
  shareButton?.classList.toggle('intro-pending', pending);
  downloadButton?.classList.toggle('intro-pending', pending);
  signalButtons.forEach((button) => {
    button.classList.toggle('signal-revealed', revealed.includes(button.dataset.signal));
  });
  legendItems.forEach((item) => {
    item.classList.toggle('legend-revealed', revealed.includes(item.dataset.signal));
  });
}

function revealSignal(key) {
  const button = document.querySelector(`.signal[data-signal="${key}"]`);
  const legendItem = document.querySelector(`.legend-item[data-signal="${key}"]`);
  button?.classList.add('signal-revealed');
  legendItem?.classList.add('legend-revealed');
}

function getTranslation(key) {
  return key.split('.').reduce((value, part) => value?.[part], translations[currentLocale]) ?? key;
}

function setStoredLocale(locale) {
  try { localStorage.setItem('ai-countdown-locale', locale); } catch (error) { /* localStorage may be unavailable */ }
}

function applyLocale(locale) {
  currentLocale = translations[locale] ? locale : 'ru';
  document.documentElement.lang = currentLocale;
  document.title = getTranslation('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', getTranslation('meta.description'));

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = getTranslation(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((element) => {
    element.innerHTML = getTranslation(element.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
    element.setAttribute('aria-label', getTranslation(element.dataset.i18nAria));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.setAttribute('placeholder', getTranslation(element.dataset.i18nPlaceholder));
  });
  document.querySelector('svg')?.setAttribute('aria-label', getTranslation('aria.rings'));
  document.querySelector('.locale-switch')?.setAttribute('aria-label', getTranslation('language'));
  document.querySelectorAll('.locale-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.locale === currentLocale);
    button.setAttribute('aria-pressed', button.dataset.locale === currentLocale ? 'true' : 'false');
  });
  setStoredLocale(currentLocale);
  activateSignal(activeSignal);
  setCenterLabel(centerMode);
  if (lastSlopPayload) updateDataStatus(lastSlopPayload);
  if (lastCombinedSnapshot) updateSelfBuildMetric(lastCombinedSnapshot);
  if (lastWorkIndex) updateWorkMetric(lastWorkIndex);
  if (lastLifeIndex) updateLifeMetric(lastLifeIndex);
  if (lastSourceFeeds) updateSourceFeedStatus(lastSourceFeeds);
  if (lastGithubContributors) updateGithubContributorStatus(lastGithubContributors);
  if (lastRepositoryAnalysis) renderRepositoryAnalysis(lastRepositoryAnalysis);
  if (lastRepositoryAnalysisLeaderboard.length) renderRepositoryAnalysisLeaderboard(lastRepositoryAnalysisLeaderboard);
  if (lastRepositoryCleanLeaderboard.items.length) renderRepositoryCleanLeaderboard(lastRepositoryCleanLeaderboard.items, lastRepositoryCleanLeaderboard.criteria);
  if (lastContributorAnalysis) renderContributorAnalysis(lastContributorAnalysis);
  const repositoryProgress = document.querySelector('#repo-analysis-progress');
  if (repositoryProgress && !repositoryProgress.hidden) updateRepositoryAnalysisProgressCopy(Number(document.querySelector('#repo-analysis-progress-percent')?.textContent) || 0);
}

function getOverallValue() {
  const parsed = Number(document.querySelector('#code-value')?.textContent);
  const code = Number.isFinite(parsed) ? parsed : INITIAL_RING_VALUES.code;
  return (code * .4) + (currentWorkValue * .35) + (currentLifeValue * .25);
}

function setCenterLabel(key) {
  centerMode = key;
  const label = document.querySelector('#center-label');
  const center = document.querySelector('.meter-center');
  if (center) {
    center.classList.remove('is-code', 'is-work', 'is-life', 'is-overall');
    center.classList.add(`is-${key}`);
  }
  if (label) label.textContent = getTranslation(`meter.center.${key}`);
}

function setCenterValue(value, decimals = centerMode === 'overall' ? 1 : 0) {
  const output = document.querySelector('#overall');
  if (output) output.textContent = `${Number(value).toFixed(decimals)}%`;
}

function animateCenterCounter(target, duration, mode, fromValue = 0) {
  cancelAnimationFrame(centerCounterFrame);
  setCenterLabel(mode);
  const startedAt = performance.now();
  const decimals = mode === 'overall' ? 1 : 0;
  const tick = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = fromValue + ((target - fromValue) * eased);
    setCenterValue(value, decimals);
    if (progress < 1) centerCounterFrame = requestAnimationFrame(tick);
  };
  centerCounterFrame = requestAnimationFrame(tick);
}

function renderOverall() {
  if (centerMode === 'overall') setCenterValue(getOverallValue(), 1);
}

function updateCodeMetric(value) {
  if (!Number.isFinite(Number(value))) return;
  const code = Math.round(Math.max(0, Math.min(100, Number(value))));
  // Do not let a late API response retarget the first ring while it is
  // travelling from empty to full. Apply the fresh value after the intro so
  // the opening animation can never visually run backwards.
  if (introSequenceRunning) {
    pendingCodeValue = code;
    return;
  }
  document.querySelector('#code-ring').style.strokeDashoffset = String(100 - code);
  document.querySelector('#code-value').textContent = String(code);
  document.querySelector('#code-legend-value').textContent = `${code}%`;

  renderOverall();
  if (introSequenceRunning && centerMode === 'code') {
    const currentValue = Number.parseFloat(document.querySelector('#overall')?.textContent) || 0;
    animateCenterCounter(code, 700, 'code', currentValue);
  }
}

function updateWorkMetric(payload) {
  lastWorkIndex = payload;
  const value = Number(payload?.value);
  if (Number.isFinite(value)) {
    const work = Math.round(Math.max(0, Math.min(100, value)));
    currentWorkValue = work;
    const ring = document.querySelector('#work-ring');
    if (ring && !introSequenceRunning) ring.style.strokeDashoffset = String(100 - work);
    const strong = document.querySelector('.signal[data-signal="work"] > strong');
    if (strong) strong.innerHTML = `${work}<span>%</span>`;
    const legend = document.querySelector('.legend-pct.work');
    if (legend) legend.textContent = `${work}%`;
  }

  const sources = Array.isArray(payload?.sourceValues) ? payload.sourceValues : [];
  const measured = sources.some((source) => source.id !== 'ai-countdown-work-baseline');
  const status = document.querySelector('[data-i18n="work.confidence"]');
  if (status) status.textContent = getTranslation(measured ? 'work.observed' : 'work.confidence');

  const ratings = payload?.occupationRatings;
  const labels = {
    'ai-countdown-work-baseline': getTranslation('work.sources.baseline'),
    'ai-countdown-occupation-ratings': getTranslation('work.sources.occupations')
  };
  const breakdown = sources
    .map((source) => `${labels[source.id] || source.id}: ${Number(source.value).toFixed(1)}%`)
    .concat(ratings && !ratings.comparable
      ? [`${labels['ai-countdown-occupation-ratings']}: ${ratings.coverage?.scored || 0} / ${ratings.coverage?.occupations || 0}`]
      : [])
    .join(' · ');
  const button = document.querySelector('.signal[data-signal="work"]');
  if (button && breakdown) button.title = breakdown;
  renderOverall();
}

function updateLifeMetric(payload) {
  lastLifeIndex = payload;
  const value = Number(payload?.value);
  if (Number.isFinite(value)) {
    const life = Math.round(Math.max(0, Math.min(100, value)));
    currentLifeValue = life;
    const ring = document.querySelector('#life-ring');
    if (ring && !introSequenceRunning) ring.style.strokeDashoffset = String(100 - life);
    const strong = document.querySelector('.signal[data-signal="life"] > strong');
    if (strong) strong.innerHTML = `${life}<span>%</span>`;
    const legend = document.querySelector('.legend-pct.life');
    if (legend) legend.textContent = `${life}%`;
  }

  const sources = Array.isArray(payload?.sourceValues) ? payload.sourceValues : [];
  const measured = sources.some((source) => source.id !== 'ai-countdown-life-baseline');
  const status = document.querySelector('[data-i18n="life.confidence"]');
  if (status) status.textContent = getTranslation(measured ? 'life.observed' : 'life.confidence');
  const labels = {
    'ai-countdown-life-baseline': getTranslation('life.sources.baseline'),
    'ai-countdown-life-task-ratings': getTranslation('life.sources.tasks')
  };
  const breakdown = sources
    .map((source) => `${labels[source.id] || source.id}: ${Number(source.value).toFixed(1)}%`)
    .join(' · ');
  const button = document.querySelector('.signal[data-signal="life"]');
  if (button && breakdown) button.title = breakdown;
  renderOverall();
}

function animateInitialRings() {
  const sequenceId = ++introSequenceId;
  const stage = document.querySelector('.ring-stage');
  const signalKeys = ['code', 'work', 'life'];
  setSignalIntroState({ pending: true });
  if (!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Object.entries({ ...INITIAL_RING_VALUES, work: currentWorkValue, life: currentLifeValue }).forEach(([key, value]) => {
      const ring = document.querySelector(`#${key}-ring`);
      if (ring) ring.style.strokeDashoffset = String(100 - value);
    });
    stage?.classList.remove('intro-sequence');
    stage?.classList.add('overall-ready');
    setSignalIntroState({ pending: false, revealed: signalKeys });
    setCenterLabel('overall');
    setCenterValue(getOverallValue(), 1);
    return;
  }

  const sequence = [
    { key: 'code', ringId: 'code-ring', value: () => Number(document.querySelector('#code-value')?.textContent) || INITIAL_RING_VALUES.code },
    { key: 'work', ringId: 'work-ring', value: () => currentWorkValue },
    { key: 'life', ringId: 'life-ring', value: () => currentLifeValue }
  ];
  const rings = sequence.map(({ key, ringId }) => ({ key, ring: document.querySelector(`#${ringId}`) })).filter(({ ring }) => ring);

  rings.forEach(({ ring }) => {
    ring.getAnimations?.().forEach((animation) => animation.cancel());
    ring.style.transition = 'none';
    ring.style.setProperty('stroke-dashoffset', '100', 'important');
    ring.classList.remove('intro-ring-active');
    // Flush the empty state before enabling the long transition. A fresh
    // API value can already have painted this ring; forcing the reset with
    // !important plus a layout read prevents the first ring from travelling
    // backwards from the cached value on refresh.
    ring.getBoundingClientRect();
  });

  introSequenceRunning = true;
  const runRing = (index) => {
    const item = sequence[index];
    if (!item) {
      introSequenceRunning = false;
      if (pendingCodeValue !== null) {
        const nextCodeValue = pendingCodeValue;
        pendingCodeValue = null;
        updateCodeMetric(nextCodeValue);
      }
      stage.classList.remove('intro-sequence');
      stage.classList.add('overall-ready');
      setSignalIntroState({ pending: false, revealed: signalKeys });
      const previousValue = Number.parseFloat(document.querySelector('#overall')?.textContent) || 0;
      animateCenterCounter(getOverallValue(), 900, 'overall', previousValue);
      return;
    }

    const ring = document.querySelector(`#${item.ringId}`);
    const value = Math.max(0, Math.min(100, Number(item.value()) || 0));
    if (!ring) return runRing(index + 1);

    stage.classList.add('intro-sequence');
    ring.classList.add('intro-ring-active');
    setCenterLabel(item.key);
    animateCenterCounter(value, INTRO_RING_DURATION, item.key, 0);
    // Two frames make the empty state observable even on a hard refresh.
    // Starting the timer only after the target value is written keeps the
    // visual duration aligned with the counter in the centre.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (sequenceId !== introSequenceId) return;
      ring.style.setProperty('transition', `stroke-dashoffset ${INTRO_RING_DURATION}ms cubic-bezier(.45,0,.55,1)`, 'important');
      ring.style.setProperty('stroke-dashoffset', String(100 - value), 'important');

      window.setTimeout(() => {
        if (sequenceId !== introSequenceId) return;
        revealSignal(item.key);
        ring.classList.remove('intro-ring-active');
        ring.style.setProperty('stroke-dashoffset', String(100 - value));
        ring.style.removeProperty('transition');
        ring.style.opacity = '.92';
        window.setTimeout(() => runRing(index + 1), INTRO_RING_GAP);
      }, INTRO_RING_DURATION);
    }));
  };

  runRing(0);
}

// Plain-language explanation of the Code value: which sources the median uses, their
// values, sample sizes and the date of the external snapshot.
function formatCodeSourceSentence(payload) {
  const sources = (Array.isArray(payload?.sourceValues) ? payload.sourceValues : [])
    .filter((source) => Number.isFinite(Number(source?.value)));
  const codeValue = Number(payload?.codeIndex);
  if (!sources.length || !Number.isFinite(codeValue)) return '';
  const formatPercent = (value) => Number(value).toLocaleString(currentLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const parts = sources.map((source) => {
    if (source.id === 'ai-code-radar') {
      const repos = Number(payload?.coverage?.included);
      return getTranslation('data.sourceRadar')
        .replace('{value}', formatPercent(source.value))
        .replace('{repos}', Number.isFinite(repos) && repos > 0 ? repos.toLocaleString(currentLocale) : '—')
        .replace('{date}', formatAnalysisSnapshotDate(payload?.updatedAt));
    }
    if (source.id === 'ai-countdown-repository-analyses') {
      return getTranslation('data.sourceOurs')
        .replace('{value}', formatPercent(source.value))
        .replace('{repos}', Number(source.repositories || 0).toLocaleString(currentLocale));
    }
    if (source.id === 'sonar-state-of-code-2026') {
      return getTranslation('data.sourceSurvey').replace('{value}', formatPercent(source.value));
    }
    if (source.id === 'daniotti-2026-ai-python-functions') {
      return getTranslation('data.sourceStudy').replace('{value}', formatPercent(source.value));
    }
    return `${source.label || source.id} ${formatPercent(source.value)}%`;
  });
  return getTranslation(parts.length > 1 ? 'data.median' : 'data.single')
    .replace('{value}', formatPercent(codeValue))
    .replace('{sources}', parts.length > 2
      ? `${parts.slice(0, -1).join(', ')}${getTranslation('data.sourceJoin')}${parts.at(-1)}`
      : parts.join(getTranslation('data.sourceJoin')));
}

function updateCodeSourceVisual(payload) {
  const visual = document.querySelector('#code-source-visual');
  const medianEl = document.querySelector('#code-source-median');
  const medianValueEl = document.querySelector('#code-source-median-value');
  const radarMarker = document.querySelector('#code-source-radar-marker');
  const radarValueEl = document.querySelector('#code-source-radar-value');
  const oursMarker = document.querySelector('#code-source-ours-marker');
  const oursValueEl = document.querySelector('#code-source-ours-value');
  const surveyMarker = document.querySelector('#code-source-survey-marker');
  const surveyKey = document.querySelector('#code-source-survey-key');
  const surveyValueEl = document.querySelector('#code-source-survey-value');
  const studyMarker = document.querySelector('#code-source-study-marker');
  const studyKey = document.querySelector('#code-source-study-key');
  const studyValueEl = document.querySelector('#code-source-study-value');
  if (!visual || !medianEl || !medianValueEl || !radarMarker || !radarValueEl || !oursMarker || !oursValueEl) return;

  const median = Number(payload?.codeIndex);
  const sources = Array.isArray(payload?.sourceValues) ? payload.sourceValues : [];
  const radar = sources.find((source) => source?.id === 'ai-code-radar');
  const ours = sources.find((source) => source?.id === 'ai-countdown-repository-analyses');
  // A developer survey that also sees AI used without public markers.
  const survey = sources.find((source) => source?.id === 'sonar-state-of-code-2026');
  const radarValue = Number(radar?.value);
  const oursValue = Number(ours?.value);
  const surveyValue = Number(survey?.value);
  // A detector study of AI-written functions on GitHub.
  const study = sources.find((source) => source?.id === 'daniotti-2026-ai-python-functions');
  const studyValue = Number(study?.value);
  const usableSources = [radarValue, oursValue].filter(Number.isFinite);
  if (!Number.isFinite(median) || !usableSources.length) {
    visual.hidden = true;
    return;
  }

  const clampPercent = (value) => Math.max(0, Math.min(100, value));
  const formatPercent = (value) => `${Number(value).toLocaleString(currentLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  const setMarker = (marker, value, valueEl) => {
    const available = Number.isFinite(value);
    marker.hidden = !available;
    valueEl.textContent = available ? formatPercent(value) : '—';
    if (available) marker.style.left = `${clampPercent(value)}%`;
  };

  medianEl.style.width = `${clampPercent(median)}%`;
  medianValueEl.textContent = formatPercent(median);
  setMarker(radarMarker, radarValue, radarValueEl);
  setMarker(oursMarker, oursValue, oursValueEl);
  if (surveyMarker && surveyKey && surveyValueEl) {
    setMarker(surveyMarker, surveyValue, surveyValueEl);
    surveyKey.hidden = !Number.isFinite(surveyValue);
  }
  if (studyMarker && studyKey && studyValueEl) {
    setMarker(studyMarker, studyValue, studyValueEl);
    studyKey.hidden = !Number.isFinite(studyValue);
  }
  visual.hidden = false;
  const visualParts = [
    `${getTranslation('data.barMedian')} ${formatPercent(median)}`,
    Number.isFinite(radarValue) ? `${getTranslation('data.barRadar')} ${formatPercent(radarValue)}` : '',
    Number.isFinite(oursValue) ? `${getTranslation('data.barOurs')} ${formatPercent(oursValue)}` : '',
    Number.isFinite(surveyValue) ? `${getTranslation('data.barSurvey')} ${formatPercent(surveyValue)}` : '',
    Number.isFinite(studyValue) ? `${getTranslation('data.barStudy')} ${formatPercent(studyValue)}` : ''
  ].filter(Boolean);
  visual.setAttribute('aria-label', visualParts.join('; '));
}

function updateDataStatus(payload) {
  lastSlopPayload = payload;
  const statusKey = {
    live: 'data.live',
    'stale-cache': 'data.cached',
    'stale-source': 'data.staleSource',
    auxiliary: 'data.auxiliary',
    bootstrap: 'data.bootstrap',
    baseline: 'data.baseline'
  }[payload?.status] || 'data.unavailable';
  const element = document.querySelector('#data-status');
  if (!element) return;
  const included = Number(payload?.coverage?.included);
  const total = Number(payload?.coverage?.catalogTotal);
  const coverage = Number.isFinite(included) && included > 0
    ? ` · ${included.toLocaleString(currentLocale)}${Number.isFinite(total) && total > 0 ? ` / ${total.toLocaleString(currentLocale)}` : ''}`
    : '';
  const codeStatus = document.querySelector('[data-i18n="code.confidence"]');
  if (codeStatus) codeStatus.textContent = getTranslation(Number.isFinite(payload?.codeIndex) && payload?.status !== 'baseline' ? 'code.observed' : 'code.confidence');
  const sourceLabel = payload?.sourceLabel ? ` · ${payload.sourceLabel}` : '';
  const sourceSentence = formatCodeSourceSentence(payload);
  element.textContent = sourceSentence || `${getTranslation(statusKey)}${sourceLabel}${coverage}`;
  updateCodeSourceVisual(payload);
  // The median itself is current; only an unavailable or illustrative value is a warning.
  element.classList.toggle('stale', sourceSentence ? false : payload?.status !== 'live');
  const sourceValues = Array.isArray(payload?.sourceValues) ? payload.sourceValues : [];
  const sourceBreakdown = sourceValues
    .filter((source) => Number.isFinite(Number(source?.value)))
    .map((source) => `${source.label || source.id}: ${Number(source.value).toFixed(1)}%${Number.isFinite(Number(source.repositories)) ? ` (${Number(source.repositories).toLocaleString(currentLocale)} repo)` : ''}`)
    .join(' · ');
  if (payload?.fetchedAt || payload?.cachedAt || sourceBreakdown) {
    element.title = [payload?.updatedAt || payload?.fetchedAt || payload?.cachedAt, sourceBreakdown].filter(Boolean).join(' · ');
  }
}

function updateSelfBuildMetric(payload) {
  const metric = payload?.methodology?.selfBuilding;
  const value = Number(metric?.value);
  if (!Number.isFinite(value)) return;
  const formatted = `${value.toLocaleString(currentLocale, { minimumFractionDigits: value % 1 ? 1 : 0, maximumFractionDigits: 1 })}%`;
  const status = document.querySelector('#self-build-status');
  const valueElement = document.querySelector('#self-build-value');
  const fill = document.querySelector('#self-build-bar-fill');
  const sources = document.querySelector('#self-build-sources');
  const meta = document.querySelector('#self-build-meta');
  if (status) status.textContent = getTranslation('selfBuild.statusTemplate').replace('{value}', formatted);
  if (valueElement) valueElement.textContent = formatted;
  if (fill) fill.style.width = `${Math.max(0, Math.min(100, value))}%`;
  const sourceValues = Array.isArray(metric.sourceValues) ? metric.sourceValues : [];
  if (sources && sourceValues.length) {
    sources.textContent = sourceValues
      .map((source) => `${source.label || source.id} ${Number(source.value).toLocaleString(currentLocale, { maximumFractionDigits: 1 })}%${source.lowerBound ? '+' : ''}`)
      .join(' · ');
  }
  const coverage = metric.coverage?.included;
  const computedAt = Date.parse(metric.computedAt || '');
  const date = Number.isFinite(computedAt)
    ? new Date(computedAt).toLocaleDateString(currentLocale === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  if (meta) {
    meta.textContent = [
      Number.isFinite(Number(coverage)) ? `${currentLocale === 'ru' ? 'в медиане' : 'median of'} ${coverage} ${currentLocale === 'ru' ? 'материалов' : 'materials'}` : '',
      date ? `${currentLocale === 'ru' ? 'замер' : 'measured'} ${date}` : ''
    ].filter(Boolean).join(' · ');
  }
  const bar = document.querySelector('.self-build-bar');
  if (bar) bar.setAttribute('aria-label', `${getTranslation('selfBuild.aria').replace(/\d+(?:[.,]\d+)?/, formatted.replace('%', ''))} (${formatted})`);
}

function getFeedStatusLabel(status) {
  return {
    live: getTranslation('source.liveStatus'),
    'stale-source': getTranslation('source.staleStatus'),
    'stale-cache': getTranslation('source.cacheStatus')
  }[status] || getTranslation('source.feedUnavailable');
}

function updateSourceFeedStatus(payload) {
  lastSourceFeeds = payload;
  const radar = payload?.feeds?.['ai-code-radar'];
  const meo = payload?.feeds?.['meo-workforce-data'];
  const botcommits = payload?.feeds?.botcommits;
  const radarElement = document.querySelector('#radar-feed-value');
  const meoElement = document.querySelector('#meo-feed-value');
  const botcommitsElement = document.querySelector('#botcommits-feed-value');
  if (radarElement) {
    radarElement.textContent = radar && Number.isFinite(Number(radar.value))
      ? `${Number(radar.value).toFixed(1)}% · ${Number(radar.coverage?.included || 0).toLocaleString(currentLocale)} ${currentLocale === 'ru' ? 'реп.' : 'repos'} · ${getFeedStatusLabel(radar.status)}`
      : getTranslation('source.feedUnavailable');
  }
  if (meoElement) {
    meoElement.textContent = meo && Number.isFinite(Number(meo.value))
      ? `${currentLocale === 'ru' ? 'Потенциал автоматизации' : 'Automation exposure'}: ${Number(meo.value).toFixed(1)} / 100 · ${Number(meo.coverage?.rows || 0).toLocaleString(currentLocale)} ${currentLocale === 'ru' ? 'профессий' : 'occupations'} · ${getFeedStatusLabel(meo.status)}`
      : getTranslation('source.feedUnavailable');
  }
  if (botcommitsElement) {
    botcommitsElement.textContent = botcommits && Number.isFinite(Number(botcommits.value))
      ? `${Number(botcommits.value).toLocaleString(currentLocale)} ${currentLocale === 'ru' ? 'коммитов Claude' : 'Claude commits'} · ${botcommits.period || '—'} · ${getFeedStatusLabel(botcommits.status)}`
      : getTranslation('source.feedUnavailable');
  }
}

function getGithubContributorStatusLabel(status) {
  if (status === 'live') return currentLocale === 'ru' ? 'снимок источника' : 'source snapshot';
  if (status === 'stale-cache') return currentLocale === 'ru' ? 'сохранённый снимок' : 'saved snapshot';
  if (status === 'partial') return currentLocale === 'ru' ? 'частичный результат' : 'partial result';
  return getTranslation('source.feedUnavailable');
}

function updateGithubContributorStatus(payload) {
  lastGithubContributors = payload;
  const element = document.querySelector('#github-contributors-value');
  if (!element) return;
  const summary = payload?.summary || {};
  const projects = Number(summary.projectCount);
  const commits = Number(summary.commitCount);
  if (!Number.isFinite(projects) || payload?.status === 'unavailable') {
    element.textContent = getTranslation('source.feedUnavailable');
    return;
  }
  const projectLabel = currentLocale === 'ru'
    ? (summary.limited ? 'реп. найдено' : 'реп.')
    : (summary.limited ? 'repos found' : 'repos');
  const commitLabel = currentLocale === 'ru' ? 'комм.' : 'commits';
  const projectCount = `${summary.limited ? '≥' : ''}${projects.toLocaleString(currentLocale)}`;
  const commitCount = summary.limited ? `≥${commits.toLocaleString(currentLocale)}` : commits.toLocaleString(currentLocale);
  element.textContent = `${projectCount} ${projectLabel} · ${commitCount} ${commitLabel} · ${getGithubContributorStatusLabel(payload.status)}`;
}

function getChartMetrics() {
  const readValue = (selector, fallback) => {
    const value = Number.parseFloat(document.querySelector(selector)?.textContent || '');
    return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback;
  };
  const code = readValue('#code-value', INITIAL_RING_VALUES.code);
  const work = readValue('.signal[data-signal="work"] > strong', currentWorkValue);
  const life = readValue('.signal[data-signal="life"] > strong', currentLifeValue);
  return { code, work, life, overall: (code * .4) + (work * .35) + (life * .25) };
}

function getShareDate() {
  return new Date().toLocaleDateString(currentLocale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function roundRectPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function loadShareLogo() {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = 'robot-apple.png';
  });
}

async function createShareCanvas() {
  if (document.fonts?.ready) await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const context = canvas.getContext('2d');
  const metrics = getChartMetrics();
  const logo = await loadShareLogo();
  const colors = { code: '#b59cff', work: '#6dfff4', life: '#d8ff70' };
  const gradientStops = {
    code: ['#8965ff', '#c5b3ff', '#8d68ed'],
    work: ['#39ddd2', '#79fff1', '#1fc9c2'],
    life: ['#b9ff46', '#eaff79', '#a7f52e']
  };
  const labels = currentLocale === 'ru'
    ? { title: 'КАКУЮ ЧАСТЬ ЖИЗНИ УЖЕ ЗАНИМАЕТ AI?', overall: 'ИТОГО', code: 'КОД', work: 'РАБОТА', life: 'ЖИЗНЬ' }
    : { title: 'HOW MUCH OF LIFE DOES AI ALREADY OCCUPY?', overall: 'TOTAL', code: 'CODE', work: 'WORK', life: 'LIFE' };

  context.fillStyle = '#08090b';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(174,216,211,.12)';
  context.lineWidth = 1;
  context.strokeRect(32.5, 32.5, canvas.width - 65, canvas.height - 65);

  if (logo) {
    context.drawImage(logo, 72, 60, 64, 64);
  }
  context.fillStyle = '#f0fbf8';
  context.font = '800 24px ui-sans-serif, system-ui, sans-serif';
  context.fillText('AI COUNTDOWN', 154, 88);
  context.fillStyle = '#8aa6a6';
  context.font = '500 18px ui-sans-serif, system-ui, sans-serif';
  context.fillText(getShareDate(), 154, 116);
  context.fillStyle = '#f0fbf8';
  context.font = '800 28px ui-sans-serif, system-ui, sans-serif';
  context.fillText(labels.title, 72, 190);

  const centerX = 365;
  const centerY = 505;
  const rings = [
    { radius: 220, value: metrics.life, color: colors.life },
    { radius: 169, value: metrics.work, color: colors.work },
    { radius: 118, value: metrics.code, color: colors.code }
  ];
  rings.forEach(({ radius, value, color }) => {
    const ringKey = radius === 220 ? 'life' : radius === 169 ? 'work' : 'code';
    const gradient = context.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
    gradientStops[ringKey].forEach((stop, index, stops) => gradient.addColorStop(index / (stops.length - 1), stop));
    context.save();
    context.translate(centerX, centerY);
    context.rotate(-Math.PI / 2);
    context.beginPath();
    context.strokeStyle = 'rgba(180,216,212,.14)';
    context.lineWidth = 28;
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.strokeStyle = gradient;
    context.lineCap = 'round';
    context.shadowColor = color;
    context.shadowBlur = 22;
    context.arc(0, 0, radius, 0, Math.PI * 2 * (value / 100));
    context.stroke();
    context.restore();
  });

  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#8aa6a6';
  context.font = '800 15px ui-sans-serif, system-ui, sans-serif';
  context.letterSpacing = '3px';
  context.fillText(labels.overall, centerX, centerY - 47);
  context.fillStyle = '#f0fbf8';
  context.font = '800 82px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.letterSpacing = '0px';
  context.fillText(`${metrics.overall.toFixed(1)}%`, centerX, centerY + 18);
  context.restore();

  const legend = [
    { label: labels.code, value: metrics.code, color: colors.code },
    { label: labels.work, value: metrics.work, color: colors.work },
    { label: labels.life, value: metrics.life, color: colors.life }
  ];
  legend.forEach((item, index) => {
    const y = 355 + (index * 112);
    roundRectPath(context, 700, y, 390, 78, 16);
    context.fillStyle = 'rgba(18,20,23,.96)';
    context.fill();
    context.strokeStyle = item.color;
    context.globalAlpha = .55;
    context.stroke();
    context.globalAlpha = 1;
    context.fillStyle = item.color;
    context.beginPath();
    context.arc(735, y + 39, 8, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#f0fbf8';
    context.font = '800 22px ui-sans-serif, system-ui, sans-serif';
    context.fillText(item.label, 765, y + 47);
    context.fillStyle = item.color;
    context.font = '800 34px ui-sans-serif, system-ui, sans-serif';
    context.textAlign = 'right';
    context.fillText(`${item.value.toFixed(0)}%`, 1058, y + 47);
    context.textAlign = 'left';
  });

  const codeFeed = lastSourceFeeds?.feeds?.['ai-code-radar'];
  const coverage = lastSlopPayload?.coverage || codeFeed?.coverage || {};
  const codeIndex = Number.isFinite(Number(lastSlopPayload?.codeIndex))
    ? Number(lastSlopPayload.codeIndex)
    : metrics.code;
  const included = Number(coverage.included);
  const total = Number(coverage.catalogTotal || coverage.repositories);
  const formatCount = (value) => Number.isFinite(value) ? value.toLocaleString(currentLocale) : '—';
  const snapshotTimestamp = codeFeed?.computedAt || lastSlopPayload?.updatedAt;
  const snapshotDate = Number.isFinite(Date.parse(snapshotTimestamp || ''))
    ? new Date(snapshotTimestamp).toLocaleDateString(currentLocale === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
    : currentLocale === 'ru' ? 'дата не указана' : 'date unavailable';
  const footerLines = currentLocale === 'ru'
    ? [
      'Оценка использования AI в коде, работе и повседневной жизни.',
      `Снимок отчёта: ${getShareDate()} · учтено 10 источников.`,
      `Code: ${codeIndex.toFixed(1)}% по ${formatCount(included)} из ${formatCount(total)} репозиториев; данные источника — на ${snapshotDate}.`,
      'Work и Life — собственные модельные оценки.'
    ]
    : [
      'An estimate of AI use in code, work, and everyday life.',
      `Report snapshot: ${getShareDate()} · 10 sources included.`,
      `Code: ${codeIndex.toFixed(1)}% across ${formatCount(included)} of ${formatCount(total)} repositories; source data as of ${snapshotDate}.`,
      'Work and Life are our own model estimates.'
    ];
  context.fillStyle = '#789494';
  context.font = '500 15px ui-sans-serif, system-ui, sans-serif';
  footerLines.forEach((line, index) => context.fillText(line, 72, 790 + (index * 20)));
  drawDomainWatermark(context, { right: 1128, baseline: 850 });
  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function getChartSummary(metrics) {
  const overallLabel = currentLocale === 'ru' ? 'Итого' : 'Total';
  return `AI Countdown · ${getShareDate()}\nCode: ${metrics.code.toFixed(0)}%\nWork: ${metrics.work.toFixed(0)}%\nLife: ${metrics.life.toFixed(0)}%\n${overallLabel}: ${metrics.overall.toFixed(1)}%\n${getTranslation('meter.note')}`;
}

function setActionLabel(button, translationKey) {
  const label = button?.querySelector('[data-action-label]');
  if (label) label.textContent = getTranslation(translationKey);
}

async function copyChartToClipboard() {
  const button = document.querySelector('#copy-chart');
  const status = document.querySelector('#copy-chart-status');
  const metrics = getChartMetrics();
  if (!button) return;
  button.disabled = true;
  try {
    const canvas = await createShareCanvas();
    const blob = await canvasToBlob(canvas);
    if (blob && navigator.clipboard?.write && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setActionLabel(button, 'meter.copied');
      if (status) status.textContent = getTranslation('meter.copied');
    } else {
      await navigator.clipboard.writeText(getChartSummary(metrics));
      setActionLabel(button, 'meter.copyFallback');
      if (status) status.textContent = getTranslation('meter.copyFallback');
    }
  } catch (error) {
    try {
      await navigator.clipboard.writeText(getChartSummary(metrics));
      setActionLabel(button, 'meter.copyFallback');
      if (status) status.textContent = getTranslation('meter.copyFallback');
    } catch (fallbackError) {
      if (status) status.textContent = getTranslation('meter.copyError');
      console.warn('Could not copy chart or summary.', error, fallbackError);
    }
  } finally {
    window.setTimeout(() => {
      button.disabled = false;
      setActionLabel(button, 'meter.copyChart');
      if (status) status.textContent = '';
    }, 2600);
  }
}

async function downloadChart() {
  const button = document.querySelector('#download-chart');
  const status = document.querySelector('#copy-chart-status');
  if (!button) return;
  button.disabled = true;

  try {
    const canvas = await createShareCanvas();
    const blob = await canvasToBlob(canvas);
    if (!blob) throw new Error('Chart image could not be created.');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-countdown-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setActionLabel(button, 'meter.downloaded');
    if (status) status.textContent = getTranslation('meter.downloaded');
  } catch (error) {
    if (status) status.textContent = getTranslation('meter.copyError');
    console.warn('Could not download chart.', error);
  } finally {
    window.setTimeout(() => {
      button.disabled = false;
      setActionLabel(button, 'meter.downloadChart');
      if (status) status.textContent = '';
    }, 2600);
  }
}

async function shareChart() {
  const button = document.querySelector('#share-chart');
  const status = document.querySelector('#copy-chart-status');
  const metrics = getChartMetrics();
  if (!button) return;
  button.disabled = true;

  const summary = getChartSummary(metrics);
  const shareData = {
    title: 'AI Countdown',
    text: summary,
    url: window.location.href.split('#')[0]
  };

  try {
    if (navigator.share) {
      try {
        const canvas = await createShareCanvas();
        const blob = await canvasToBlob(canvas);
        if (blob && window.File && navigator.canShare) {
          const file = new File([blob], 'ai-countdown.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) shareData.files = [file];
        }
      } catch (error) {
        console.warn('Could not prepare the chart image for sharing.', error);
      }
      await navigator.share(shareData);
      setActionLabel(button, 'meter.shared');
      if (status) status.textContent = getTranslation('meter.shared');
    } else {
      await navigator.clipboard.writeText(`${summary}\n${shareData.url}`);
      setActionLabel(button, 'meter.shareFallback');
      if (status) status.textContent = getTranslation('meter.shareFallback');
    }
  } catch (error) {
    if (error?.name !== 'AbortError') {
      try {
        await navigator.clipboard.writeText(`${summary}\n${shareData.url}`);
        setActionLabel(button, 'meter.shareFallback');
        if (status) status.textContent = getTranslation('meter.shareFallback');
      } catch (fallbackError) {
        if (status) status.textContent = getTranslation('meter.copyError');
        console.warn('Could not share the chart or copy its link.', error, fallbackError);
      }
    }
  } finally {
    window.setTimeout(() => {
      button.disabled = false;
      setActionLabel(button, 'meter.shareChart');
      if (status) status.textContent = '';
    }, 2600);
  }
}

async function loadSourceFeeds() {
  try {
    const response = await fetch(apiUrl('/api/source-feeds'), {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Source feeds API returned ${response.status}`);
    updateSourceFeedStatus(await response.json());
  } catch (error) {
    updateSourceFeedStatus({ feeds: {} });
    console.warn('Source feeds unavailable; cards remain linked to the public sources.', error);
  }
}

async function loadGithubContributors() {
  try {
    const response = await fetch(apiUrl('/api/github-contributors'), {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`GitHub contributors API returned ${response.status}`);
    updateGithubContributorStatus(await response.json());
  } catch (error) {
    updateGithubContributorStatus({ status: 'unavailable' });
    console.warn('GitHub contributor data unavailable; source card remains linked to GitHub.', error);
  }
}

async function loadCombinedSnapshot() {
  try {
    const response = await fetch(apiUrl('/api/combined-snapshot'), {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Combined snapshot API returned ${response.status}`);
    const payload = await response.json();
    lastCombinedSnapshot = payload;
    updateSourceFeedStatus(payload.inputs?.sourceFeeds || { feeds: {} });
    updateGithubContributorStatus(payload.inputs?.githubContributors || { status: 'unavailable' });
    if (payload.methodology?.life) updateLifeMetric(payload.methodology.life);
    updateSelfBuildMetric(payload);
    return payload;
  } catch (error) {
    console.warn('Combined snapshot unavailable; loading individual cached feeds.', error);
    await Promise.all([loadSourceFeeds(), loadGithubContributors()]);
    return null;
  }
}

function formatAnalysisNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString(currentLocale) : '—';
}

function formatAnalysisDiff(additions, deletions) {
  return `<span class="repository-analysis-additions">+${formatAnalysisNumber(additions)}</span><span class="repository-analysis-deletions">−${formatAnalysisNumber(deletions)}</span>`;
}

function formatAnalysisSnapshotDate(value) {
  const timestamp = Date.parse(value || '');
  if (!Number.isFinite(timestamp)) return '—';
  return new Date(timestamp).toLocaleDateString(currentLocale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function getRepositoryAnalysisDurationMs(payload) {
  const rawDuration = payload?.analysisDurationMs;
  const explicitDuration = Number(rawDuration);
  if (rawDuration !== null && rawDuration !== undefined && rawDuration !== '' && Number.isFinite(explicitDuration) && explicitDuration >= 0) return explicitDuration;

  const rawSeconds = payload?.analysisDurationSeconds;
  const explicitSeconds = Number(rawSeconds);
  if (rawSeconds !== null && rawSeconds !== undefined && rawSeconds !== '' && Number.isFinite(explicitSeconds) && explicitSeconds >= 0) return explicitSeconds * 1000;

  const requestedAt = Date.parse(payload?.requestedAt || '');
  const fetchedAt = Date.parse(payload?.fetchedAt || '');
  if (Number.isFinite(requestedAt) && Number.isFinite(fetchedAt) && fetchedAt >= requestedAt) {
    return fetchedAt - requestedAt;
  }
  return null;
}

function formatRepositoryAnalysisDuration(payload) {
  const durationMs = getRepositoryAnalysisDurationMs(payload);
  if (!Number.isFinite(durationMs)) return '';
  const seconds = durationMs / 1000;
  const displaySeconds = seconds >= 10 ? Math.round(seconds) : Number(seconds.toFixed(1));
  return getTranslation('repoAnalysis.analysisDuration').replace('{seconds}', String(displaySeconds));
}

function formatRepositoryAnalysisReceivedStatus(payload) {
  return [
    getTranslation('repoAnalysis.resultReceived'),
    formatAnalysisSnapshotDate(payload?.fetchedAt || payload?.requestedAt),
    formatRepositoryAnalysisDuration(payload)
  ].filter(Boolean).join(' · ');
}

function formatRelativeAnalysisTime(value) {
  const timestamp = Date.parse(value || '');
  if (!Number.isFinite(timestamp)) return '—';
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (currentLocale !== 'ru') {
    if (elapsedSeconds < 60) return 'just now';
    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }
  if (elapsedSeconds < 60) return 'только что';
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes} ${russianPlural(minutes, 'минуту', 'минуты', 'минут')} назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${russianPlural(hours, 'час', 'часа', 'часов')} назад`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${russianPlural(days, 'день', 'дня', 'дней')} назад`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${russianPlural(months, 'месяц', 'месяца', 'месяцев')} назад`;
  const years = Math.floor(months / 12);
  return `${years} ${russianPlural(years, 'год', 'года', 'лет')} назад`;
}

function russianPlural(value, one, few, many) {
  const number = Math.abs(Number(value)) % 100;
  const last = number % 10;
  if (number >= 11 && number <= 14) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

function escapeAnalysisHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getRepositoryAnalysisStatusLabel(status) {
  const key = {
    live: 'live',
    partial: 'partial',
    background: 'background',
    cached: 'cached',
    'stale-cache': 'staleCache',
    unavailable: 'unavailable',
    queued: 'loading'
  }[status] || 'unavailable';
  return getTranslation(`repoAnalysis.${key}`);
}

function getGithubContributorProfileUrl(item) {
  const login = item?.login || (/^[a-z\d-]+$/i.test(String(item?.identity || '')) ? item.identity : null);
  const candidate = item?.profileUrl || (login ? `https://github.com/${encodeURIComponent(login)}` : null);
  return /^https:\/\/github\.com\//i.test(String(candidate || '')) ? candidate : null;
}

function getGithubContributorAvatarUrl(item) {
  const login = item?.login || (/^[a-z\d-]+$/i.test(String(item?.identity || '')) ? item.identity : null);
  const candidate = item?.avatarUrl || (login ? `https://github.com/${encodeURIComponent(login)}.png?size=96` : null);
  return /^(https:\/\/avatars\.githubusercontent\.com\/|https:\/\/github\.com\/)/i.test(String(candidate || '')) ? candidate : null;
}

function getRepositoryAnalysisLastCommit(item, payload) {
  if (item?.lastCommit && (item.lastCommit.date || item.lastCommit.message)) return item.lastCommit;
  const commits = Array.isArray(payload?.commits) ? payload.commits : [];
  const candidates = [item?.identity, item?.agentLabel, item?.agentId, item?.login, item?.name]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());
  const matches = commits.filter((commit) => {
    if (!commit || (item?.kind && commit.kind !== item.kind)) return false;
    const values = item?.kind === 'ai'
      ? [commit.agent, commit.contributor]
      : [commit.contributor, commit.identity, commit.login];
    return values.some((value) => candidates.includes(String(value || '').trim().toLowerCase()));
  });
  return matches
    .filter((commit) => commit.date || commit.message)
    .sort((left, right) => Date.parse(right.date || '') - Date.parse(left.date || ''))[0] || null;
}

function formatRepositoryCommitMessage(value, maxLength = 96) {
  const message = String(value || 'Без сообщения').replace(/\s+/g, ' ').trim();
  return message.length > maxLength
    ? `${message.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`
    : message;
}

function renderRepositoryAnalysisLastCommit(item, payload) {
  const lastCommit = getRepositoryAnalysisLastCommit(item, payload);
  if (!lastCommit) return '';
  const fullCommitMessage = String(lastCommit.message || 'Без сообщения').replace(/\s+/g, ' ').trim();
  const commitMessage = formatRepositoryCommitMessage(fullCommitMessage, 58);
  const commitUrl = /^https:\/\/github\.com\//i.test(String(lastCommit.url || '')) ? lastCommit.url : null;
  const messageMarkup = commitUrl
    ? `<a class="external-link" href="${escapeAnalysisHtml(commitUrl)}" target="_blank" rel="noreferrer" title="${escapeAnalysisHtml(fullCommitMessage)}">${escapeAnalysisHtml(commitMessage)}</a>`
    : `<span class="repository-analysis-person-last-commit-message" title="${escapeAnalysisHtml(fullCommitMessage)}">${escapeAnalysisHtml(commitMessage)}</span>`;
  return `<small class="repository-analysis-person-last-commit"><span class="repository-analysis-person-last-commit-meta">${escapeAnalysisHtml(getTranslation('repoAnalysis.lastCommit'))} · ${escapeAnalysisHtml(formatRelativeAnalysisTime(lastCommit.date))}</span><span aria-hidden="true">·</span>${messageMarkup}</small>`;
}

function bindRepositoryContributionInteractions(entries) {
  const track = document.querySelector('#repo-analysis-contribution-track');
  if (!track) return;
  track._repositoryContributionEntries = entries;
  const segments = [...track.querySelectorAll('.repository-analysis-contribution-segment')];
  if (!segments.length) return;

  let selectedIndex = null;
  const updateHighlight = (index) => {
    const currentEntries = track._repositoryContributionEntries || entries;
    const legendItems = [...document.querySelectorAll('#repo-analysis-contribution-legend .repository-analysis-contribution-item')];
    const agentRows = [...document.querySelectorAll('#repo-analysis-agents .repository-analysis-person')];
    const contributorList = document.querySelector('#repo-analysis-contributors');
    segments.forEach((segment) => segment.classList.toggle('is-highlighted', Number(segment.dataset.index) === index));
    legendItems.forEach((item) => item.classList.toggle('is-highlighted', Number(item.dataset.index) === index));
    agentRows.forEach((row) => {
      const entry = currentEntries[index];
      const matches = entry?.kind === 'ai'
        && row.dataset.analysisKind === 'ai'
        && row.dataset.analysisIdentity === String(entry.label || '').trim().toLowerCase();
      row.classList.toggle('is-highlighted', matches);
    });
    contributorList?.classList.toggle('is-highlighted', currentEntries[index]?.kind === 'human');
  };
  const toggleSelected = (index) => {
    selectedIndex = selectedIndex === index ? null : index;
    updateHighlight(selectedIndex);
  };
  const clearHover = () => {
    updateHighlight(selectedIndex);
  };

  [...segments, ...document.querySelectorAll('#repo-analysis-contribution-legend .repository-analysis-contribution-item')].forEach((element) => {
    if (element.dataset.interactionsBound === 'true') return;
    element.dataset.interactionsBound = 'true';
    const index = Number(element.dataset.index);
    element.addEventListener('mouseenter', () => updateHighlight(index));
    element.addEventListener('mouseleave', clearHover);
    element.addEventListener('focus', () => updateHighlight(index));
    element.addEventListener('blur', clearHover);
    element.addEventListener('click', () => toggleSelected(index));
    element.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggleSelected(index);
    });
  });
}

function getRepositoryContributionEntryKey(entry) {
  return `${entry.kind}:${entry.agentId || entry.label || 'unknown'}`.trim().toLowerCase();
}

function updateRepositoryContributionBarInPlace(track, legend, normalized) {
  const segments = [...track.querySelectorAll('.repository-analysis-contribution-segment')];
  const legendItems = [...legend.querySelectorAll('.repository-analysis-contribution-item')];
  if (segments.length !== normalized.length || legendItems.length !== normalized.length) return false;
  const currentKeys = segments.map((segment) => segment.dataset.entryKey || '');
  const nextKeys = normalized.map((entry) => getRepositoryContributionEntryKey(entry));
  if (currentKeys.join('|') !== nextKeys.join('|')) return false;

  normalized.forEach((entry, index) => {
    const share = entry.share.toFixed(1);
    const brand = getAgentBrand(entry, entry.kind === 'human');
    const label = `${entry.label} · ${share}%`;
    const segment = segments[index];
    const legendItem = legendItems[index];
    segment.style.setProperty('--segment-color', brand.color);
    segment.style.width = `${entry.share}%`;
    segment.title = label;
    segment.setAttribute('aria-label', label);
    legendItem.style.setProperty('--agent-color', brand.color);
    legendItem.setAttribute('aria-label', label);
    const legendLabel = legendItem.querySelector('.repository-analysis-contribution-label');
    const legendValue = legendItem.querySelector('strong');
    if (legendLabel) legendLabel.textContent = entry.label;
    if (legendValue) legendValue.textContent = `${share}%`;
  });
  track._repositoryContributionEntries = normalized;
  return true;
}

// The author-repository profile is computed only for the largest human contributors;
// rows without favoriteAgentStatus were not checked and show nothing.
function renderRepositoryContributorFavoriteAgent(item) {
  const status = item?.favoriteAgentStatus;
  if (!status) return '';
  const share = Number(item.favoriteAgentShare);
  let text;
  if (status === 'ok' && item.favoriteAgentLabel && Number.isFinite(share)) {
    text = getTranslation(item.attributedAgentId ? 'repoAnalysis.favoriteAgent' : 'repoAnalysis.favoriteAgentLow')
      .replace('{agent}', item.favoriteAgentLabel)
      .replace('{share}', share.toFixed(1));
  } else if (status === 'no-agent') {
    text = getTranslation('repoAnalysis.favoriteNoAgent');
  } else if (status === 'insufficient-data') {
    text = getTranslation('repoAnalysis.favoriteInsufficient');
  } else if (status === 'unavailable') {
    text = getTranslation('repoAnalysis.favoriteUnavailable');
  } else {
    return '';
  }
  return `<small class="repository-analysis-person-last-commit repository-analysis-favorite-agent" data-favorite-status="${escapeAnalysisHtml(status)}"><span class="repository-analysis-person-last-commit-meta">${escapeAnalysisHtml(getTranslation('repoAnalysis.favoriteLabel'))}</span><span aria-hidden="true">·</span><span class="repository-analysis-person-last-commit-message" title="${escapeAnalysisHtml(text)}">${escapeAnalysisHtml(text)}</span></small>`;
}

function renderRepositoryAnalysisList(element, items, emptyKey, payload) {
  if (!element) return;
  if (!Array.isArray(items) || !items.length) {
    element.innerHTML = `<p class="repository-analysis-empty">${escapeAnalysisHtml(getTranslation(emptyKey))}</p>`;
    return;
  }
  element.innerHTML = items.slice(0, 6).map((item) => {
    const label = item.name || item.identity || item.agentLabel || '—';
    const login = item.login || (item.name && item.identity && item.name !== item.identity ? item.identity : null);
    const share = Number.isFinite(Number(item.changedShare)) ? `${Number(item.changedShare).toFixed(1)}%` : '—';
    const changedShare = Number.isFinite(Number(item.changedShare))
      ? Number(item.changedShare)
      : Number(payload?.summary?.changedLines) > 0
        ? (Number(item.changedLines) / Number(payload.summary.changedLines)) * 100
        : null;
    const changedShareMarkup = Number.isFinite(changedShare) ? ` · ${changedShare.toFixed(1)}%` : '';
    const agentBrand = item.kind === 'ai' || item.agentId || item.agentLabel ? getAgentBrand(item) : null;
    const avatarUrl = agentBrand?.icon || getGithubContributorAvatarUrl(item);
    const profileUrl = getGithubContributorProfileUrl(item);
    const fallback = escapeAnalysisHtml(String(agentBrand?.fallback || label).trim().slice(0, 2).toUpperCase() || '?');
    const inferredAgent = item.kind === 'human' && item.attributedAgentId
      ? { agentId: item.attributedAgentId, identity: item.attributedAgentLabel }
      : null;
    const inferredBrand = inferredAgent ? getAgentBrand(inferredAgent) : null;
    const inferredShare = Number.isFinite(Number(item.attributedAgentShare)) ? Number(item.attributedAgentShare).toFixed(1) : '50';
    const inferredTitle = inferredAgent
      ? getTranslation('repoAnalysis.attributedAgent')
        .replace('{agent}', inferredAgent.identity || inferredAgent.agentId)
        .replace('{share}', inferredShare)
      : '';
    const inferredIcon = inferredBrand
      ? `<span class="repository-analysis-person-agent-badge" style="--agent-color:${inferredBrand.color}" title="${escapeAnalysisHtml(inferredTitle)}" aria-label="${escapeAnalysisHtml(inferredTitle)}"><span>${escapeAnalysisHtml(inferredBrand.fallback)}</span>${inferredBrand.icon ? `<img src="${escapeAnalysisHtml(inferredBrand.icon)}" alt="" aria-hidden="true" onerror="this.hidden=true">` : ''}</span>`
      : '';
    const favoriteMarkup = item.kind === 'human' ? renderRepositoryContributorFavoriteAgent(item) : '';
    const avatar = `<span class="repository-analysis-person-avatar"><span class="repository-analysis-person-avatar-fallback">${fallback}</span>${avatarUrl ? `<img src="${escapeAnalysisHtml(avatarUrl)}" alt="" aria-hidden="true" onerror="this.hidden=true">` : ''}${inferredIcon}</span>`;
    const nameMarkup = profileUrl
      ? `<a href="${escapeAnalysisHtml(profileUrl)}" target="_blank" rel="noreferrer">${escapeAnalysisHtml(label)}</a>`
      : `<b>${escapeAnalysisHtml(label)}</b>`;
    const identityLabel = login ? `@${login} · ` : '';
    const analysisIdentity = String(item.identity || item.agentLabel || item.name || label).trim().toLowerCase();
    return `<div class="repository-analysis-person" data-analysis-kind="${escapeAnalysisHtml(item.kind || '')}" data-analysis-identity="${escapeAnalysisHtml(analysisIdentity)}"><div class="repository-analysis-person-main">${avatar}<div class="repository-analysis-person-copy">${nameMarkup}<small>${escapeAnalysisHtml(identityLabel)}${formatAnalysisNumber(item.commits)} ${currentLocale === 'ru' ? 'комм.' : 'commits'} · ${formatAnalysisDiff(item.additions, item.deletions)} · ${formatAnalysisNumber(item.changedLines)} ${currentLocale === 'ru' ? 'строк' : 'lines'}${changedShareMarkup}</small>${favoriteMarkup}${renderRepositoryAnalysisLastCommit(item, payload)}</div></div><strong>${share}</strong></div>`;
  }).join('');
}

const AGENT_BRANDS = {
  claude: { color: '#d97757', icon: 'https://github.com/claude.png?size=96', fallback: 'C' },
  copilot: { color: '#f1f5f9', icon: 'https://github.com/github.png?size=96', fallback: '⌘' },
  codex: { color: '#9bf7cf', icon: 'https://github.com/openai.png?size=96', fallback: 'O' },
  gpt: { color: '#9bf7cf', icon: 'https://github.com/openai.png?size=96', fallback: 'O' },
  gemini: { color: '#7aa7ff', icon: 'https://github.com/google-gemini.png?size=96', fallback: '✦' },
  jules: { color: '#8ab4f8', icon: 'https://github.com/google-labs-code.png?size=96', fallback: 'J' },
  aider: { color: '#ffb86b', icon: 'https://github.com/Aider-AI.png?size=96', fallback: 'A' },
  devin: { color: '#7dd3fc', icon: 'https://github.com/CognitionAI.png?size=96', fallback: 'D' },
  cursor: { color: '#000000', icon: 'https://cursor.com/favicon.svg', fallback: 'C' },
  windsurf: { color: '#61dafb', icon: 'https://github.com/Codeium.png?size=96', fallback: 'W' },
  cline: { color: '#b08cff', icon: 'https://github.com/cline.png?size=96', fallback: 'CL' },
  qodo: { color: '#ff6b9d', icon: 'https://github.com/qodo-ai.png?size=96', fallback: 'Q' },
  'amazon-q': { color: '#ff9900', icon: 'https://github.com/Amazon-Q-Developer.png?size=96', fallback: 'Q' },
  junie: { color: '#ff4f9a', icon: 'https://github.com/jetbrains-junie.png?size=96', fallback: 'J' },
  cody: { color: '#f15b4f', icon: 'https://github.com/sourcegraph.png?size=96', fallback: 'C' },
  replit: { color: '#f26207', icon: 'https://github.com/replit.png?size=96', fallback: 'R' },
  others: { color: '#d9e7e3', icon: null, fallback: '·' }
};

function getAgentBrand(agent, isOthers = false) {
  if (isOthers) return AGENT_BRANDS.others;
  const hint = String(agent?.agentId || agent?.identity || agent?.agentLabel || '').toLowerCase();
  const match = Object.keys(AGENT_BRANDS).find((key) => key !== 'others' && hint.includes(key));
  return match ? AGENT_BRANDS[match] : { color: '#b59cff', icon: null, fallback: 'AI' };
}

function animateRepositoryContributionBar(entries) {
  const segments = [...document.querySelectorAll('#repo-analysis-contribution-track .repository-analysis-contribution-segment')];
  segments.forEach((segment) => {
    segment.style.width = '0%';
    segment.classList.remove('is-filling', 'is-filled');
  });

  let delay = 80;
  segments.forEach((segment) => {
    const entry = entries[Number(segment.dataset.index)];
    if (!entry) return;
    window.setTimeout(() => {
      segment.classList.add('is-filling');
      segment.style.width = `${entry.share}%`;
      window.setTimeout(() => segment.classList.add('is-filled'), 760);
    }, delay);
    delay += 840;
  });
}

function renderRepositoryContributionBar(payload, { animate = repositoryContributionOpen, liveUpdate = false } = {}) {
  const track = document.querySelector('#repo-analysis-contribution-track');
  const legend = document.querySelector('#repo-analysis-contribution-legend');
  const totalLabel = document.querySelector('#repo-analysis-contribution-total');
  if (!track || !legend) return;

  const summary = payload?.summary || {};
  const total = Number(summary.changedLines) || 0;
  const aiEntries = Array.isArray(payload?.agents) ? payload.agents.map((agent) => ({
    ...agent,
    label: agent.identity || agent.agentLabel || 'AI agent',
    kind: 'ai'
  })) : [];
  const entries = [
    ...aiEntries,
    {
      label: getTranslation('repoAnalysis.others'),
      kind: 'human',
      changedLines: Number(summary.humanChangedLines) || 0,
      commits: Number(summary.humanCommits) || 0
    }
  ];

  if (!total) {
    track.innerHTML = '';
    legend.innerHTML = `<p class="repository-analysis-empty">${escapeAnalysisHtml(getTranslation('repoAnalysis.noContributionData'))}</p>`;
    if (totalLabel) totalLabel.textContent = '—';
    return;
  }

  const normalized = entries
    .filter((entry) => Number(entry.changedLines) > 0)
    .map((entry) => ({
      ...entry,
      share: (Number(entry.changedLines) / total) * 100
    }));
  const structureKey = normalized.map((entry) => getRepositoryContributionEntryKey(entry)).join('|');

  if (liveUpdate
    && track.dataset.contributionStructure === structureKey
    && updateRepositoryContributionBarInPlace(track, legend, normalized)) {
    track.setAttribute('aria-label', `${getTranslation('repoAnalysis.contributionTitle')}: ${normalized.map((entry) => `${entry.label} ${entry.share.toFixed(1)}%`).join(', ')}`);
    if (totalLabel) totalLabel.innerHTML = `${formatAnalysisNumber(total)} ${escapeAnalysisHtml(getTranslation('repoAnalysis.changedLines'))} · ${formatAnalysisDiff(summary.additions, summary.deletions)}`;
    return;
  }

  track.setAttribute('aria-label', `${getTranslation('repoAnalysis.contributionTitle')}: ${normalized.map((entry) => `${entry.label} ${entry.share.toFixed(1)}%`).join(', ')}`);
  track.innerHTML = normalized.map((entry, index) => {
    const brand = getAgentBrand(entry, entry.kind === 'human');
    const entryKey = getRepositoryContributionEntryKey(entry);
    return `<span class="repository-analysis-contribution-segment ${entry.kind === 'human' ? 'is-others' : ''}" data-index="${index}" data-entry-key="${escapeAnalysisHtml(entryKey)}" role="button" tabindex="0" aria-label="${escapeAnalysisHtml(`${entry.label} · ${entry.share.toFixed(1)}%`)}" style="--segment-color:${brand.color}; width:${liveUpdate ? entry.share : 0}%" title="${escapeAnalysisHtml(`${entry.label} · ${entry.share.toFixed(1)}%`)}"></span>`;
  }).join('');
  legend.innerHTML = normalized.map((entry, index) => {
    const brand = getAgentBrand(entry, entry.kind === 'human');
    const icon = brand.icon ? `<img src="${brand.icon}" alt="" aria-hidden="true" onerror="this.hidden=true">` : '';
    const iconClass = entry.kind === 'human' ? ' is-others' : '';
    const entryKey = getRepositoryContributionEntryKey(entry);
    return `<div class="repository-analysis-contribution-item" data-index="${index}" data-entry-key="${escapeAnalysisHtml(entryKey)}" role="button" tabindex="0" aria-label="${escapeAnalysisHtml(`${entry.label} · ${entry.share.toFixed(1)}%`)}" style="--agent-color:${brand.color}"><span class="repository-analysis-agent-icon${iconClass}" style="--agent-color:${brand.color}" aria-hidden="true"><span class="repository-analysis-agent-fallback">${escapeAnalysisHtml(brand.fallback)}</span>${entry.kind === 'human' ? '' : icon}</span><span class="repository-analysis-contribution-label">${escapeAnalysisHtml(entry.label)}</span><strong>${entry.share.toFixed(1)}%</strong></div>`;
  }).join('');
  track.dataset.contributionStructure = structureKey;
  track._repositoryContributionEntries = normalized;
  bindRepositoryContributionInteractions(normalized);
  if (totalLabel) totalLabel.innerHTML = `${formatAnalysisNumber(total)} ${escapeAnalysisHtml(getTranslation('repoAnalysis.changedLines'))} · ${formatAnalysisDiff(summary.additions, summary.deletions)}`;
  if (animate && !liveUpdate) requestAnimationFrame(() => animateRepositoryContributionBar(normalized));
}

function renderRepositoryAnalysis(payload, { liveUpdate = false } = {}) {
  lastRepositoryAnalysis = payload;
  const result = document.querySelector('#repo-analysis-result');
  if (!result) return;
  const summary = payload?.summary;
  if (!summary || !payload.repository) {
    result.hidden = true;
    return;
  }

  result.hidden = false;
  const repositoryName = document.querySelector('#repo-analysis-name');
  const repositoryLink = document.querySelector('#repo-analysis-link');
  const resultStatus = document.querySelector('#repo-analysis-result-status');
  if (repositoryName) repositoryName.textContent = payload.repository.fullName || '—';
  if (repositoryLink) {
    repositoryLink.href = payload.repository.url || '#';
    repositoryLink.textContent = payload.repository.url || 'github.com';
  }
  if (resultStatus) {
    resultStatus.textContent = getRepositoryAnalysisStatusLabel(payload.status);
    resultStatus.className = `repository-analysis-badge status-${payload.status || 'unavailable'}`;
  }
  const analysisStatus = document.querySelector('#repo-analysis-status');
  if (analysisStatus?.classList.contains('is-success')) {
    analysisStatus.textContent = formatRepositoryAnalysisReceivedStatus(payload);
  }

  const aiLines = document.querySelector('#repo-analysis-ai-lines');
  const aiShare = document.querySelector('#repo-analysis-ai-share');
  const totalLines = document.querySelector('#repo-analysis-total-lines');
  const windowLabel = document.querySelector('#repo-analysis-window');
  const commits = document.querySelector('#repo-analysis-commits');
  const coverage = document.querySelector('#repo-analysis-coverage');
  const lastCommitElement = document.querySelector('#repo-analysis-last-commit');
  const aiChangedShare = Number(summary.aiChangedShare);
  if (aiLines) {
    aiLines.innerHTML = Number.isFinite(aiChangedShare)
      ? `<span class="repository-analysis-metric-value">${escapeAnalysisHtml(formatAnalysisNumber(summary.aiChangedLines))}</span><span class="repository-analysis-metric-share">${aiChangedShare.toFixed(1)}%</span>`
      : escapeAnalysisHtml(formatAnalysisNumber(summary.aiChangedLines));
  }
  if (aiShare) aiShare.innerHTML = Number.isFinite(aiChangedShare) ? `${formatAnalysisDiff(summary.aiAdditions, summary.aiDeletions)} · ${escapeAnalysisHtml(getTranslation('repoAnalysis.shareOfAllChanges'))}` : '—';
  if (totalLines) totalLines.textContent = formatAnalysisNumber(summary.changedLines);
  if (windowLabel) {
    const historyWindow = payload.window?.scope === 'all'
      ? getTranslation('repoAnalysis.allHistory')
      : `${currentLocale === 'ru' ? 'за' : 'last'} ${payload.window?.days || 365} ${currentLocale === 'ru' ? 'дней' : 'days'}`;
    windowLabel.innerHTML = `${formatAnalysisDiff(summary.additions, summary.deletions)} · ${escapeAnalysisHtml(historyWindow)}`;
  }
  if (commits) commits.textContent = `${formatAnalysisNumber(summary.aiCommits)} / ${formatAnalysisNumber(summary.analyzedCommits)}`;
  if (coverage) coverage.textContent = `${formatAnalysisNumber(summary.statsCoverage)}% ${getTranslation('repoAnalysis.coverage')}`;
  if (lastCommitElement) {
    const lastCommit = (Array.isArray(payload.commits) ? payload.commits : [])
      .filter((commit) => commit?.date || commit?.message)
      .sort((left, right) => Date.parse(right.date || '') - Date.parse(left.date || ''))[0];
    if (lastCommit) {
      const fullCommitMessage = String(lastCommit.message || 'Без сообщения').replace(/\s+/g, ' ').trim();
      const commitMessage = formatRepositoryCommitMessage(fullCommitMessage, 88);
      const commitUrl = /^https:\/\/github\.com\//i.test(String(lastCommit.url || '')) ? lastCommit.url : null;
      const messageMarkup = commitUrl
        ? `<a class="repository-analysis-last-commit-message external-link" href="${escapeAnalysisHtml(commitUrl)}" target="_blank" rel="noreferrer" title="${escapeAnalysisHtml(fullCommitMessage)}">${escapeAnalysisHtml(commitMessage)}</a>`
        : `<span class="repository-analysis-last-commit-message" title="${escapeAnalysisHtml(fullCommitMessage)}">${escapeAnalysisHtml(commitMessage)}</span>`;
      lastCommitElement.innerHTML = `<span class="repository-analysis-last-commit-meta">${escapeAnalysisHtml(getTranslation('repoAnalysis.lastCommit'))} · ${escapeAnalysisHtml(formatRelativeAnalysisTime(lastCommit.date))}</span><span aria-hidden="true">·</span>${messageMarkup}`;
      lastCommitElement.hidden = false;
    } else {
      lastCommitElement.hidden = true;
      lastCommitElement.textContent = '';
    }
  }
  renderRepositoryContributionBar(payload, {
    animate: !liveUpdate && repositoryContributionOpen,
    liveUpdate
  });
  renderRepositoryAnalysisList(document.querySelector('#repo-analysis-agents'), payload.agents, 'repoAnalysis.noAgents', payload);
  renderRepositoryAnalysisList(document.querySelector('#repo-analysis-contributors'), payload.contributors, 'repoAnalysis.noContributors', payload);
  const note = document.querySelector('#repo-analysis-note');
  if (note) {
    const notes = Array.isArray(payload.notes) ? payload.notes : [];
    note.textContent = notes.join(' ');
  }
}

function renderRepositoryAnalysisLeaderboard(items) {
  const section = document.querySelector('#repo-analysis-leaderboard');
  const list = document.querySelector('#repo-analysis-leaderboard-list');
  if (!section || !list) return;
  lastRepositoryAnalysisLeaderboard = Array.isArray(items) ? items : [];
  if (!lastRepositoryAnalysisLeaderboard.length) {
    section.hidden = true;
    list.innerHTML = '';
    return;
  }

  section.hidden = false;
  list.innerHTML = lastRepositoryAnalysisLeaderboard.slice(0, 3).map((item, index) => {
    const repository = item.repository || {};
    const fullName = repository.fullName || '—';
    const repositoryUrl = /^https:\/\/github\.com\//i.test(String(repository.url || '')) ? repository.url : null;
    const nameMarkup = repositoryUrl
      ? `<a href="${escapeAnalysisHtml(repositoryUrl)}" target="_blank" rel="noreferrer">${escapeAnalysisHtml(fullName)}</a>`
      : `<b>${escapeAnalysisHtml(fullName)}</b>`;
    const agentName = item.topAgent?.identity || 'AI agent';
    const brand = getAgentBrand({ identity: agentName });
    const icon = brand.icon ? `<img src="${escapeAnalysisHtml(brand.icon)}" alt="" aria-hidden="true" onerror="this.hidden=true">` : '';
    const share = Number.isFinite(Number(item.aiChangedShare)) ? Math.max(0, Math.min(100, Number(item.aiChangedShare))) : 0;
    const totalChangedLines = Number(item.totalChangedLines) || Number(item.aiChangedLines) || 0;
    const leaderboardScore = Number.isFinite(Number(item.leaderboardScore))
      ? Number(item.leaderboardScore)
      : Math.round((Number(item.aiChangedLines) || 0) * Math.min(1, totalChangedLines / REPOSITORY_ANALYSIS_LEADERBOARD_REFERENCE_LINES));
    const snapshot = `${getTranslation('repoAnalysis.leaderboardSnapshot')} ${formatAnalysisSnapshotDate(item.fetchedAt)}`;
    const textClass = brand.color.toLowerCase() === '#000000' ? ' is-dark-brand' : '';
    return `<article class="repository-analysis-leaderboard-card${textClass}" style="--leaderboard-color:${brand.color}">
      <div class="repository-analysis-leaderboard-rank">${String(index + 1).padStart(2, '0')}</div>
      <div class="repository-analysis-leaderboard-copy">
        <div class="repository-analysis-leaderboard-name">${nameMarkup}</div>
        <div class="repository-analysis-leaderboard-agent"><span class="repository-analysis-leaderboard-agent-icon"><span>${escapeAnalysisHtml(brand.fallback)}</span>${icon}</span><span>${escapeAnalysisHtml(agentName)}</span></div>
        <small>${formatAnalysisNumber(item.aiCommits)} ${escapeAnalysisHtml(getTranslation('repoAnalysis.leaderboardCommits'))} · ${formatAnalysisNumber(totalChangedLines)} ${escapeAnalysisHtml(getTranslation('repoAnalysis.leaderboardTotalLines'))} · ${escapeAnalysisHtml(getTranslation('repoAnalysis.leaderboardScore'))} ${formatAnalysisNumber(leaderboardScore)} · ${escapeAnalysisHtml(snapshot)}</small>
      </div>
      <div class="repository-analysis-leaderboard-value"><strong>${formatAnalysisNumber(item.aiChangedLines)}</strong><span>${escapeAnalysisHtml(getTranslation('repoAnalysis.leaderboardLines'))}</span></div>
      <div class="repository-analysis-leaderboard-bar" aria-hidden="true"><span style="width:${share}%"></span></div>
      <div class="repository-analysis-leaderboard-share">${share.toFixed(1)}%</div>
    </article>`;
  }).join('');
}

function renderRepositoryCleanLeaderboard(items, criteria) {
  const section = document.querySelector('#repo-analysis-clean-leaderboard');
  const list = document.querySelector('#repo-analysis-clean-leaderboard-list');
  const copy = document.querySelector('#repo-analysis-clean-leaderboard-copy');
  if (!section || !list) return;
  lastRepositoryCleanLeaderboard = { items: Array.isArray(items) ? items : [], criteria: criteria || null };
  if (!lastRepositoryCleanLeaderboard.items.length) {
    section.hidden = true;
    list.innerHTML = '';
    return;
  }

  section.hidden = false;
  if (copy) {
    copy.textContent = getTranslation('repoAnalysis.cleanCopy')
      .replace('{days}', String(criteria?.activeDays ?? 90))
      .replace('{maxAi}', String(criteria?.maxAiShare ?? 5));
  }
  list.innerHTML = lastRepositoryCleanLeaderboard.items.slice(0, 3).map((item, index) => {
    const repository = item.repository || {};
    const fullName = repository.fullName || '—';
    const repositoryUrl = /^https:\/\/github\.com\//i.test(String(repository.url || '')) ? repository.url : null;
    const nameMarkup = repositoryUrl
      ? `<a href="${escapeAnalysisHtml(repositoryUrl)}" target="_blank" rel="noreferrer">${escapeAnalysisHtml(fullName)}</a>`
      : `<b>${escapeAnalysisHtml(fullName)}</b>`;
    const aiShare = Number.isFinite(Number(item.aiChangedShare)) ? Number(item.aiChangedShare) : 0;
    const humanShare = Math.max(0, Math.min(100, 100 - aiShare));
    const meta = [
      repository.language,
      `${formatAnalysisNumber(item.analyzedCommits)} ${getTranslation('repoAnalysis.cleanCommits')}`,
      `${getTranslation('repoAnalysis.cleanPushed')} ${formatRelativeAnalysisTime(repository.pushedAt)}`
    ].filter(Boolean).join(' · ');
    return `<article class="repository-analysis-leaderboard-card is-clean" style="--leaderboard-color:var(--lime)">
      <div class="repository-analysis-leaderboard-rank">${String(index + 1).padStart(2, '0')}</div>
      <div class="repository-analysis-leaderboard-copy">
        <div class="repository-analysis-leaderboard-name">${nameMarkup}</div>
        <div class="repository-analysis-leaderboard-agent"><span>${escapeAnalysisHtml(getTranslation('repoAnalysis.cleanAiShare').replace('{share}', aiShare.toFixed(1)))}</span></div>
        <small>${escapeAnalysisHtml(meta)}</small>
      </div>
      <div class="repository-analysis-leaderboard-value"><strong>${formatAnalysisNumber(item.humanChangedLines)}</strong><span>${escapeAnalysisHtml(getTranslation('repoAnalysis.cleanLines'))}</span></div>
      <div class="repository-analysis-leaderboard-bar" aria-hidden="true"><span style="width:${humanShare}%"></span></div>
      <div class="repository-analysis-leaderboard-share">${humanShare.toFixed(1)}%</div>
    </article>`;
  }).join('');
}

function deriveRepositoryAnalysisLeaderboard(repositories) {
  if (!Array.isArray(repositories)) return [];
  return repositories.map((analysis) => {
    const history = (Array.isArray(analysis.history) ? analysis.history : [])
      .filter((entry) => entry?.summary && entry?.fetchedAt)
      .sort((left, right) => Date.parse(left.fetchedAt) - Date.parse(right.fetchedAt));
    const snapshot = history.at(-1) || analysis;
    const summary = snapshot?.summary || {};
    const repository = snapshot?.repository || analysis.repository || {};
    const aiChangedLines = Number(summary.aiChangedLines) || 0;
    const totalChangedLines = Number(summary.changedLines) || 0;
    if (aiChangedLines <= 0 || totalChangedLines <= 0) return null;
    const sizeFactor = Math.min(1, totalChangedLines / REPOSITORY_ANALYSIS_LEADERBOARD_REFERENCE_LINES);
    const leaderboardScore = Math.round(aiChangedLines * sizeFactor);
    const topAgent = (Array.isArray(snapshot?.agents) ? snapshot.agents : [])
      .filter((agent) => Number(agent?.changedLines) > 0)
      .sort((left, right) => Number(right.changedLines) - Number(left.changedLines))[0] || null;
    return {
      repository: {
        fullName: repository.fullName || `${repository.owner || ''}/${repository.name || ''}`,
        url: repository.url || null
      },
      fetchedAt: snapshot?.fetchedAt || analysis.fetchedAt || null,
      status: snapshot?.status || analysis.status || null,
      aiChangedLines,
      totalChangedLines,
      leaderboardScore,
      leaderboardSizeFactor: Math.round(sizeFactor * 1000) / 10,
      aiChangedShare: Number.isFinite(Number(summary.aiChangedShare)) ? Number(summary.aiChangedShare) : null,
      aiCommits: Number(summary.aiCommits) || 0,
      analyzedCommits: Number(summary.analyzedCommits) || 0,
      topAgent: topAgent ? {
        identity: topAgent.identity || topAgent.name || topAgent.agentLabel || 'AI agent',
        changedLines: Number(topAgent.changedLines) || 0,
        changedShare: Number.isFinite(Number(topAgent.changedShare)) ? Number(topAgent.changedShare) : null
      } : null
    };
  }).filter(Boolean).sort((left, right) => right.leaderboardScore - left.leaderboardScore
    || right.aiChangedLines - left.aiChangedLines
    || right.totalChangedLines - left.totalChangedLines).slice(0, 3);
}

async function loadRepositoryAnalysisLeaderboard() {
  try {
    const response = await fetch(apiUrl('/api/repository-analyses'), {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Repository analyses API returned ${response.status}`);
    const payload = await response.json();
    const leaderboard = Array.isArray(payload.topRepositories) && payload.topRepositories.length
      ? payload.topRepositories
      : deriveRepositoryAnalysisLeaderboard(payload.repositories);
    renderRepositoryAnalysisLeaderboard(leaderboard);
    renderRepositoryCleanLeaderboard(payload.cleanRepositories, payload.cleanRepositoriesCriteria);
    return payload;
  } catch (error) {
    renderRepositoryAnalysisLeaderboard([]);
    renderRepositoryCleanLeaderboard([]);
    console.warn('Repository analysis leaderboard unavailable.', error);
    return null;
  }
}

function getRepositoryAnalysisEstimateMs() {
  try {
    const timings = JSON.parse(localStorage.getItem(REPOSITORY_ANALYSIS_TIMING_STORAGE_KEY) || '[]');
    const samples = Array.isArray(timings) ? timings.filter((value) => Number.isFinite(Number(value))) : [];
    if (samples.length) return Math.max(4_000, Math.min(60_000, samples.reduce((sum, value) => sum + Number(value), 0) / samples.length));
  } catch (error) { /* localStorage may be unavailable */ }
  return REPOSITORY_ANALYSIS_DEFAULT_ESTIMATE_MS;
}

function rememberRepositoryAnalysisDuration(durationMs, payload) {
  if (!payload || payload.status === 'cached' || payload.status === 'stale-cache') return;
  if (!Number.isFinite(durationMs) || durationMs < 500 || durationMs > 120_000) return;
  try {
    const previous = JSON.parse(localStorage.getItem(REPOSITORY_ANALYSIS_TIMING_STORAGE_KEY) || '[]');
    const samples = Array.isArray(previous) ? previous.filter((value) => Number.isFinite(Number(value))) : [];
    samples.push(Math.round(durationMs));
    localStorage.setItem(REPOSITORY_ANALYSIS_TIMING_STORAGE_KEY, JSON.stringify(samples.slice(-8)));
  } catch (error) { /* localStorage may be unavailable */ }
}

function getRepositoryAnalysisProgressPhase(percent) {
  if (percent < 36) return 'progressCollecting';
  if (percent < 73) return 'progressStats';
  return 'progressAttribution';
}

function updateRepositoryAnalysisProgressCopy(percent = 0) {
  const label = document.querySelector('#repo-analysis-progress-label');
  const note = document.querySelector('#repo-analysis-progress-note');
  if (label) label.textContent = getTranslation(`repoAnalysis.${getRepositoryAnalysisProgressPhase(percent)}`);
  if (note) {
    const seconds = Math.max(1, Math.round(getRepositoryAnalysisEstimateMs() / 1000));
    note.textContent = getTranslation('repoAnalysis.progressAverage').replace('{seconds}', String(seconds));
  }
}

function setRepositoryAnalysisProgressFill(fill, percent) {
  if (!fill) return;
  const normalized = Math.max(0, Math.min(100, Number(percent) || 0));
  fill.style.transform = `scaleX(${normalized / 100})`;
}

function updateRepositoryAnalysisProgress() {
  const fill = document.querySelector('#repo-analysis-progress-fill');
  const percentLabel = document.querySelector('#repo-analysis-progress-percent');
  if (!fill || !percentLabel || !repositoryAnalysisProgressStartedAt) return;
  const elapsed = Date.now() - repositoryAnalysisProgressStartedAt;
  const estimate = getRepositoryAnalysisEstimateMs();
  const percent = elapsed <= estimate
    ? 4 + (elapsed / estimate) * 88
    : 92 + Math.min(5, (elapsed - estimate) / 3_000);
  const rounded = Math.min(97, Math.round(percent));
  setRepositoryAnalysisProgressFill(fill, rounded);
  percentLabel.textContent = `${rounded}%`;
  updateRepositoryAnalysisProgressCopy(rounded);
}

function startRepositoryAnalysisProgress() {
  const progress = document.querySelector('#repo-analysis-progress');
  const fill = document.querySelector('#repo-analysis-progress-fill');
  const percentLabel = document.querySelector('#repo-analysis-progress-percent');
  if (!progress || !fill || !percentLabel) return;
  stopRepositoryAnalysisBackgroundPolling();
  window.clearInterval(repositoryAnalysisProgressTimer);
  repositoryAnalysisProgressStartedAt = Date.now();
  progress.hidden = false;
  progress.classList.remove('is-complete', 'is-error', 'is-background');
  setRepositoryAnalysisProgressFill(fill, 0);
  percentLabel.textContent = '0%';
  updateRepositoryAnalysisProgressCopy(0);
  updateRepositoryAnalysisProgress();
  repositoryAnalysisProgressTimer = window.setInterval(updateRepositoryAnalysisProgress, 100);
}

function updateRepositoryAnalysisBackgroundProgress(payload) {
  const progress = document.querySelector('#repo-analysis-progress');
  const fill = document.querySelector('#repo-analysis-progress-fill');
  const percentLabel = document.querySelector('#repo-analysis-progress-percent');
  const label = document.querySelector('#repo-analysis-progress-label');
  const note = document.querySelector('#repo-analysis-progress-note');
  if (!progress || !fill || !percentLabel) return;
  const isQueued = payload?.status === 'queued';
  const processed = Number(payload?.continuation?.processedCommits || payload?.summary?.analyzedCommits || 0);
  const total = Number(payload?.continuation?.totalCommits || payload?.summary?.totalHistoryCommits || 0);
  const ratio = total > 0 ? Math.min(100, Math.max(0, (processed / total) * 100)) : null;
  const percent = ratio === null ? null : ratio.toLocaleString(currentLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  progress.hidden = false;
  progress.classList.add('is-background');
  progress.classList.remove('is-complete', 'is-error');
  // GraphQL gives us the exact history connection total. Keep the fill just under
  // complete while the final page is still being persisted.
  const fillPercent = isQueued ? 18 : ratio === null ? 46 : Math.min(99.4, ratio);
  setRepositoryAnalysisProgressFill(fill, fillPercent);
  percentLabel.textContent = isQueued ? '…' : percent ? `${percent}%` : `${formatAnalysisNumber(processed)}+`;
  if (label) label.textContent = getTranslation(`repoAnalysis.${isQueued ? 'progressQueued' : 'progressBackground'}`);
  const status = document.querySelector('#repo-analysis-status');
  if (status) {
    status.className = 'repository-analysis-status is-loading';
    status.textContent = isQueued
      ? getTranslation('repoAnalysis.progressQueued')
      : total > 0
        ? `${getTranslation('repoAnalysis.recalculating')} · ${formatAnalysisNumber(processed)} / ${formatAnalysisNumber(total)} · ${percent}%`
        : `${getTranslation('repoAnalysis.recalculating')} · ${formatAnalysisNumber(processed)} ${currentLocale === 'ru' ? 'коммитов' : 'commits'}`;
  }
  if (note) {
    note.textContent = isQueued
      ? getTranslation('repoAnalysis.progressQueuedNote')
      : total > 0
        ? getTranslation('repoAnalysis.progressBackgroundNote')
          .replace('{processed}', formatAnalysisNumber(processed))
          .replace('{total}', formatAnalysisNumber(total))
          .replace('{percent}', `${percent}%`)
        : `${getTranslation('repoAnalysis.recalculating')} · ${formatAnalysisNumber(processed)}`;
  }
}

function stopRepositoryAnalysisBackgroundPolling() {
  window.clearTimeout(repositoryAnalysisBackgroundTimer);
  repositoryAnalysisBackgroundTimer = null;
  repositoryAnalysisBackgroundRepo = '';
  repositoryAnalysisBackgroundInFlight = false;
}

// GitHub rate limits come back as code 'github-rate-limit' with retryAt; show the time in
// the visitor's own time zone instead of the server's UTC wording.
function formatGithubRateLimitMessage(retryAt) {
  const timestamp = Date.parse(retryAt || '');
  if (!Number.isFinite(timestamp)) return getTranslation('repoAnalysis.rateLimited');
  const minutes = Math.ceil((timestamp - Date.now()) / 60_000);
  if (minutes <= 1) return getTranslation('repoAnalysis.rateLimitedSoon');
  const time = new Date(timestamp).toLocaleTimeString(currentLocale === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  return getTranslation('repoAnalysis.rateLimitedUntil')
    .replace('{time}', time)
    .replace('{minutes}', String(minutes));
}

function getRepositoryApiErrorMessage(payload, fallbackKey = 'repoAnalysis.error') {
  if (payload?.code === 'github-rate-limit' || /rate limit/i.test(String(payload?.error || ''))) {
    return formatGithubRateLimitMessage(payload?.retryAt);
  }
  return payload?.error || getTranslation(fallbackKey);
}

async function pollRepositoryAnalysisBackground() {
  if (!repositoryAnalysisBackgroundRepo || repositoryAnalysisBackgroundInFlight) return;
  repositoryAnalysisBackgroundInFlight = true;
  const repository = repositoryAnalysisBackgroundRepo;
  try {
    const response = await fetch(apiUrl(`/api/repository-analysis?repo=${encodeURIComponent(repository)}`), { headers: { accept: 'application/json' } });
    const payload = await response.json();
    if (!response.ok || payload.status === 'unavailable') throw new Error(getRepositoryApiErrorMessage(payload));
    renderRepositoryAnalysis(payload, { liveUpdate: true });
    await loadRepositoryAnalysisLeaderboard();
    if (payload.status === 'queued' || payload.continuation?.status === 'running' || payload.status === 'background') {
      updateRepositoryAnalysisBackgroundProgress(payload);
      repositoryAnalysisBackgroundTimer = window.setTimeout(pollRepositoryAnalysisBackground, 1_500);
      return;
    }
    if (payload.continuation?.status === 'error') {
      const status = document.querySelector('#repo-analysis-status');
      if (status) {
        status.className = 'repository-analysis-status is-error';
        status.textContent = getRepositoryApiErrorMessage({
          code: payload.code || payload.continuation?.code,
          retryAt: payload.retryAt || payload.continuation?.retryAt,
          error: payload.error || payload.continuation?.error
        }, 'repoAnalysis.partial');
      }
      stopRepositoryAnalysisBackgroundPolling();
      finishRepositoryAnalysisProgress({ error: true });
      return;
    }
    stopRepositoryAnalysisBackgroundPolling();
    rememberRepositoryAnalysisDuration(getRepositoryAnalysisDurationMs(payload), payload);
    finishRepositoryAnalysisProgress();
    const status = document.querySelector('#repo-analysis-status');
    if (status) {
      status.className = 'repository-analysis-status is-success';
      status.textContent = formatRepositoryAnalysisReceivedStatus(payload);
    }
  } catch (error) {
    const status = document.querySelector('#repo-analysis-status');
    if (status) {
      status.className = 'repository-analysis-status is-error';
      status.textContent = error.message || getTranslation('repoAnalysis.error');
    }
    stopRepositoryAnalysisBackgroundPolling();
    finishRepositoryAnalysisProgress({ error: true });
    console.warn('Repository analysis background refresh failed.', error);
  } finally {
    repositoryAnalysisBackgroundInFlight = false;
  }
}

function startRepositoryAnalysisBackgroundPolling(repository, payload) {
  stopRepositoryAnalysisBackgroundPolling();
  repositoryAnalysisBackgroundRepo = repository;
  updateRepositoryAnalysisBackgroundProgress(payload);
  repositoryAnalysisBackgroundTimer = window.setTimeout(pollRepositoryAnalysisBackground, 350);
}

function finishRepositoryAnalysisProgress({ error = false } = {}) {
  const progress = document.querySelector('#repo-analysis-progress');
  const fill = document.querySelector('#repo-analysis-progress-fill');
  const percentLabel = document.querySelector('#repo-analysis-progress-percent');
  const label = document.querySelector('#repo-analysis-progress-label');
  if (!progress || !fill || !percentLabel) return;
  window.clearInterval(repositoryAnalysisProgressTimer);
  repositoryAnalysisProgressTimer = null;
  progress.classList.remove('is-background');
  if (error) {
    progress.classList.add('is-error');
    window.setTimeout(() => { progress.hidden = true; }, 450);
    return;
  }
  setRepositoryAnalysisProgressFill(fill, 100);
  percentLabel.textContent = '100%';
  progress.classList.add('is-complete');
  if (label) label.textContent = getTranslation('repoAnalysis.progressDone');
  window.setTimeout(() => { progress.hidden = true; }, 650);
}

const GITHUB_PROFILE_URL_PATTERN = /^https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/?$/i;

function isGithubProfileInput(value) {
  return GITHUB_PROFILE_URL_PATTERN.test(String(value || '').trim());
}

// Profile analysis: the user's own commits across their own repositories, split by
// recognized agents and the person themself.
function renderContributorAnalysis(payload) {
  lastContributorAnalysis = payload;
  const section = document.querySelector('#repo-analysis-profile');
  if (!section) return;
  const result = payload?.result;
  if (!result) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  const profile = payload.profile || result.profile || {};
  const login = payload.login || result.login || '';
  const nameElement = section.querySelector('#repo-analysis-profile-name');
  const linkElement = section.querySelector('#repo-analysis-profile-link');
  const avatarElement = section.querySelector('#repo-analysis-profile-avatar');
  const statusElement = section.querySelector('#repo-analysis-profile-status');
  const summaryElement = section.querySelector('#repo-analysis-profile-summary');
  const track = section.querySelector('#repo-analysis-profile-track');
  const legend = section.querySelector('#repo-analysis-profile-legend');
  const repositories = section.querySelector('#repo-analysis-profile-repositories');
  const note = section.querySelector('#repo-analysis-profile-note');
  const profileUrl = /^https:\/\/github\.com\//i.test(String(profile.profileUrl || '')) ? profile.profileUrl : `https://github.com/${encodeURIComponent(login)}`;

  if (nameElement) nameElement.textContent = profile.name && profile.name !== login ? profile.name : `@${login}`;
  if (linkElement) {
    linkElement.href = profileUrl;
    linkElement.textContent = `github.com/${login}`;
  }
  if (avatarElement) {
    avatarElement.innerHTML = profile.avatarUrl
      ? `<img src="${escapeAnalysisHtml(profile.avatarUrl)}" alt="" aria-hidden="true" onerror="this.hidden=true">`
      : `<span>${escapeAnalysisHtml(login.slice(0, 2).toUpperCase())}</span>`;
  }

  const agents = Array.isArray(result.agents) ? result.agents : [];
  const statusKey = {
    ok: result.inferredAgentId ? 'profileStatusPrimary' : 'profileStatusOccasional',
    'no-agent': 'profileStatusNone',
    'insufficient-data': 'profileStatusInsufficient',
    unavailable: 'profileStatusUnavailable'
  }[result.status] || 'profileStatusUnavailable';
  if (statusElement) {
    statusElement.textContent = getTranslation(`repoAnalysis.${statusKey}`).replace('{agent}', result.likelyAgentLabel || '');
    statusElement.dataset.profileStatus = result.status || 'unavailable';
  }
  if (summaryElement) {
    summaryElement.textContent = getTranslation('repoAnalysis.profileSample')
      .replace('{repos}', formatAnalysisNumber(result.sampledRepositories || 0))
      .replace('{commits}', formatAnalysisNumber(result.sampledCommits || 0))
      .replace('{lines}', formatAnalysisNumber(result.sampledChangedLines || 0));
  }

  const total = Number(result.sampledChangedLines) || 0;
  const entries = [
    ...agents.map((agent) => ({
      label: agent.agentLabel || agent.agentId || 'AI agent',
      agentId: agent.agentId,
      identity: agent.agentLabel,
      kind: 'ai',
      changedLines: Number(agent.changedLines) || 0,
      commits: Number(agent.commits) || 0
    })),
    {
      label: getTranslation('repoAnalysis.profileHuman').replace('{login}', login),
      kind: 'human',
      changedLines: Number(result.contributorChangedLines) || 0,
      commits: Number(result.contributorCommits) || 0
    }
  ].filter((entry) => entry.changedLines > 0 || entry.commits > 0)
    .map((entry) => ({
      ...entry,
      share: total ? (entry.changedLines / total) * 100 : 0,
      commitShare: result.sampledCommits ? (entry.commits / result.sampledCommits) * 100 : 0
    }));

  if (track) {
    track.innerHTML = entries.filter((entry) => entry.share > 0).map((entry) => {
      const brand = getAgentBrand(entry, entry.kind === 'human');
      const title = `${entry.label} · ${entry.share.toFixed(1)}%`;
      return `<span class="repository-analysis-contribution-segment ${entry.kind === 'human' ? 'is-others' : ''}" style="--segment-color:${brand.color}; width:${entry.share}%" title="${escapeAnalysisHtml(title)}"></span>`;
    }).join('');
  }
  if (legend) {
    legend.innerHTML = entries.length
      ? entries.map((entry) => {
        const brand = getAgentBrand(entry, entry.kind === 'human');
        const icon = entry.kind === 'human'
          ? (profile.avatarUrl ? `<img src="${escapeAnalysisHtml(profile.avatarUrl)}" alt="" aria-hidden="true" onerror="this.hidden=true">` : '')
          : (brand.icon ? `<img src="${brand.icon}" alt="" aria-hidden="true" onerror="this.hidden=true">` : '');
        const detail = getTranslation('repoAnalysis.profileEntryDetail')
          .replace('{commits}', formatAnalysisNumber(entry.commits))
          .replace('{commitShare}', entry.commitShare.toFixed(1));
        return `<div class="repository-analysis-contribution-item" style="--agent-color:${brand.color}"><span class="repository-analysis-agent-icon${entry.kind === 'human' ? ' is-others' : ''}" style="--agent-color:${brand.color}" aria-hidden="true"><span class="repository-analysis-agent-fallback">${escapeAnalysisHtml(brand.fallback)}</span>${icon}</span><span class="repository-analysis-contribution-label">${escapeAnalysisHtml(entry.label)}<small>${escapeAnalysisHtml(detail)}</small></span><strong>${entry.share.toFixed(1)}%</strong></div>`;
      }).join('')
      : `<p class="repository-analysis-empty">${escapeAnalysisHtml(getTranslation('repoAnalysis.profileNoCommits'))}</p>`;
  }
  if (repositories) {
    const list = Array.isArray(result.sampledRepositoryList) ? result.sampledRepositoryList : [];
    repositories.innerHTML = list.length
      ? `${escapeAnalysisHtml(getTranslation('repoAnalysis.profileRepositories'))}: ${list.map((repository) => {
        const url = /^https:\/\/github\.com\//i.test(String(repository.url || '')) ? repository.url : null;
        return url
          ? `<a href="${escapeAnalysisHtml(url)}" target="_blank" rel="noreferrer">${escapeAnalysisHtml(repository.fullName)}</a>`
          : escapeAnalysisHtml(repository.fullName || '');
      }).join(', ')}`
      : '';
  }
  if (note) {
    note.textContent = getTranslation('repoAnalysis.profileNote')
      .replace('{threshold}', String(result.threshold ?? 50));
  }
}

async function submitContributorAnalysis(value, { button, status }) {
  const repositoryResult = document.querySelector('#repo-analysis-result');
  const profileResult = document.querySelector('#repo-analysis-profile');
  stopRepositoryAnalysisBackgroundPolling();
  button.disabled = true;
  startRepositoryAnalysisProgress();
  if (status) {
    status.className = 'repository-analysis-status is-loading';
    status.textContent = getTranslation('repoAnalysis.profileLoading');
  }
  if (repositoryResult) repositoryResult.hidden = true;
  if (profileResult) profileResult.hidden = true;

  try {
    const response = await fetch(apiUrl('/api/contributor-analysis'), {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ profile: value })
    });
    const payload = await response.json();
    if (!response.ok || payload.status === 'unavailable') throw new Error(getRepositoryApiErrorMessage(payload));
    renderContributorAnalysis(payload);
    finishRepositoryAnalysisProgress();
    if (status) {
      status.className = 'repository-analysis-status is-success';
      status.textContent = getTranslation('repoAnalysis.profileDone').replace('{login}', payload.login || '');
    }
  } catch (error) {
    if (status) {
      status.className = 'repository-analysis-status is-error';
      status.textContent = error.message || getTranslation('repoAnalysis.error');
    }
    finishRepositoryAnalysisProgress({ error: true });
    console.warn('Contributor analysis failed.', error);
  } finally {
    button.disabled = false;
  }
}

async function submitRepositoryAnalysis(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const input = form.querySelector('input[name="repository"]');
  const button = form.querySelector('button[type="submit"]');
  const status = document.querySelector('#repo-analysis-status');
  const result = document.querySelector('#repo-analysis-result');
  if (!input || !button) return;
  if (isGithubProfileInput(input.value)) {
    await submitContributorAnalysis(input.value.trim(), { button, status });
    return;
  }
  const profileResult = document.querySelector('#repo-analysis-profile');
  if (profileResult) profileResult.hidden = true;

  stopRepositoryAnalysisBackgroundPolling();
  button.disabled = true;
  startRepositoryAnalysisProgress();
  if (status) {
    status.className = 'repository-analysis-status is-loading';
    status.textContent = getTranslation('repoAnalysis.loading');
  }
  if (result) result.hidden = true;

  try {
    const response = await fetch(apiUrl('/api/repository-analysis'), {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ repository: input.value.trim(), refresh: true })
    });
    const payload = await response.json();
    if (!response.ok || payload.status === 'unavailable') throw new Error(getRepositoryApiErrorMessage(payload));
    renderRepositoryAnalysis(payload);
    await loadRepositoryAnalysisLeaderboard();
    const background = payload.status === 'queued' || payload.continuation?.status === 'running' || payload.status === 'background';
    if (background) {
      if (status) {
        status.className = 'repository-analysis-status is-loading';
        status.textContent = getTranslation(`repoAnalysis.${payload.status === 'queued' ? 'progressQueued' : 'progressBackground'}`);
      }
      startRepositoryAnalysisBackgroundPolling(input.value.trim(), payload);
    } else {
      rememberRepositoryAnalysisDuration(Date.now() - repositoryAnalysisProgressStartedAt, payload);
      finishRepositoryAnalysisProgress();
      if (status) {
        status.className = 'repository-analysis-status is-success';
        status.textContent = formatRepositoryAnalysisReceivedStatus(payload);
      }
    }
  } catch (error) {
    if (status) {
      status.className = 'repository-analysis-status is-error';
      status.textContent = error.message || getTranslation('repoAnalysis.error');
    }
    finishRepositoryAnalysisProgress({ error: true });
    console.warn('Repository analysis failed.', error);
  } finally {
    button.disabled = false;
  }
}

async function loadWorkIndex() {
  try {
    const response = await fetch(apiUrl('/api/work-index'), {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Work index API returned ${response.status}`);
    const payload = await response.json();
    updateWorkMetric(payload);
    return payload;
  } catch (error) {
    console.warn('Work index unavailable; keeping the prototype Work value.', error);
    return null;
  }
}

async function loadLifeIndex() {
  try {
    const response = await fetch(apiUrl('/api/life-index'), {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Life index API returned ${response.status}`);
    const payload = await response.json();
    updateLifeMetric(payload);
    return payload;
  } catch (error) {
    console.warn('Life index unavailable; keeping the prototype Life value.', error);
    return null;
  }
}

async function loadCodeIndex() {
  try {
    const response = await fetch(apiUrl('/api/code-index'), {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Code index API returned ${response.status}`);
    const payload = await response.json();
    updateCodeMetric(payload.codeIndex);
    updateDataStatus(payload);
    return payload;
  } catch (error) {
    updateDataStatus({ status: 'unavailable' });
    console.warn('Aggregated Code index unavailable; keeping the visible baseline.', error);
    return null;
  }
}

function activateSignal(key) {
  activeSignal = key;
  const state = translations[currentLocale].states[key];
  document.querySelectorAll('.signal').forEach((button) => {
    button.classList.toggle('active', button.dataset.signal === key);
  });
  document.querySelectorAll('.progress').forEach((ring) => { ring.style.opacity = '.78'; });
  document.querySelector(`#${{ code: 'code-ring', work: 'work-ring', life: 'life-ring' }[key]}`).style.opacity = '1';
  document.querySelector('#detail-title').textContent = state.title;
  document.querySelector('#detail-copy').textContent = state.copy;
  renderOverall();
}

document.querySelectorAll('.signal').forEach((button) => {
  button.addEventListener('click', () => activateSignal(button.dataset.signal));
});

document.querySelectorAll('.locale-btn').forEach((button) => {
  button.addEventListener('click', () => applyLocale(button.dataset.locale));
});

document.querySelector('#copy-chart')?.addEventListener('click', copyChartToClipboard);
document.querySelector('#share-chart')?.addEventListener('click', shareChart);
document.querySelector('#download-chart')?.addEventListener('click', downloadChart);

function getSiteWatermark() {
  if (typeof window !== 'undefined') {
    const host = window.location.host || window.location.hostname;
    if (host) return host;
  }
  return 'AI COUNTDOWN';
}

function updateSiteWatermarks() {
  const watermark = getSiteWatermark();
  document.querySelectorAll('[data-domain-watermark]').forEach((element) => {
    element.textContent = watermark;
  });
}

const CHART_WATERMARK = 'ai.ffnwz.lat';
const ANALYSIS_CARD_WATERMARK = CHART_WATERMARK;
const ANALYSIS_CARD_SIZE = { width: 1200, height: 630 };

function drawDomainWatermark(context, { right, baseline, domain = CHART_WATERMARK, color = 'rgba(150, 166, 168, .72)', font = '600 15px ui-sans-serif, system-ui, sans-serif' }) {
  context.save();
  context.font = font;
  context.fillStyle = color;
  context.textAlign = 'right';
  context.textBaseline = 'alphabetic';
  context.fillText(domain, right, baseline);
  context.restore();
}

function loadAnalysisCardImage(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function fitAnalysisCardText(context, text, maxWidth, startSize, minSize, weight = 800) {
  const family = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
  let size = startSize;
  do {
    context.font = `${weight} ${size}px ${family}`;
    if (context.measureText(text).width <= maxWidth) return size;
    size -= 2;
  } while (size > minSize);
  context.font = `${weight} ${minSize}px ${family}`;
  return minSize;
}

function setAnalysisCardFont(context, size, weight = 700) {
  const family = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
  context.font = `${weight} ${size}px ${family}`;
}

// Shared layout for the downloadable repository and profile cards: frame, heading,
// headline value, stacked contribution bar, legend and the site mark in the corner.
function drawAnalysisCard(context, spec, images = {}) {
  const { width, height } = ANALYSIS_CARD_SIZE;
  const pad = 64;
  context.fillStyle = '#0a0b0d';
  context.fillRect(0, 0, width, height);
  const glow = context.createRadialGradient(width * 0.85, 0, 40, width * 0.85, 0, 620);
  glow.addColorStop(0, 'rgba(181,156,255,.16)');
  glow.addColorStop(1, 'rgba(181,156,255,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = 'rgba(255,255,255,.14)';
  context.lineWidth = 2;
  context.strokeRect(24, 24, width - 48, height - 48);

  let textLeft = pad;
  if (spec.avatar !== undefined) {
    const size = 96;
    const x = pad;
    const y = 74;
    context.save();
    context.beginPath();
    context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    context.closePath();
    context.fillStyle = 'rgba(255,255,255,.06)';
    context.fill();
    context.clip();
    if (images.avatar) {
      context.drawImage(images.avatar, x, y, size, size);
    } else {
      setAnalysisCardFont(context, 34, 800);
      context.fillStyle = '#9aa3ad';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(spec.avatarFallback || '?', x + size / 2, y + size / 2);
      context.textAlign = 'left';
    }
    context.restore();
    textLeft = pad + size + 28;
  }

  context.textBaseline = 'alphabetic';
  context.textAlign = 'left';
  setAnalysisCardFont(context, 18, 800);
  context.fillStyle = '#d8ff70';
  context.fillText(spec.eyebrow.toUpperCase(), textLeft, 98);
  fitAnalysisCardText(context, spec.title, width - textLeft - pad, 54, 26, 850);
  context.fillStyle = '#f3f5f7';
  context.fillText(spec.title, textLeft, 152);
  if (spec.subtitle) {
    setAnalysisCardFont(context, 20, 600);
    context.fillStyle = '#9aa3ad';
    context.fillText(spec.subtitle, textLeft, 186);
  }

  setAnalysisCardFont(context, 112, 850);
  context.fillStyle = spec.valueColor || '#b59cff';
  context.fillText(spec.value, pad, 330);
  const valueWidth = context.measureText(spec.value).width;
  setAnalysisCardFont(context, 24, 700);
  context.fillStyle = '#f3f5f7';
  context.fillText(spec.valueLabel, pad + valueWidth + 28, 290);
  if (spec.valueDetail) {
    setAnalysisCardFont(context, 20, 600);
    context.fillStyle = '#9aa3ad';
    context.fillText(spec.valueDetail, pad + valueWidth + 28, 324);
  }

  const barY = 380;
  const barWidth = width - pad * 2;
  const barHeight = 22;
  context.fillStyle = 'rgba(255,255,255,.06)';
  context.fillRect(pad, barY, barWidth, barHeight);
  let cursor = pad;
  for (const entry of spec.entries) {
    const segment = Math.max(0, (entry.share / 100) * barWidth);
    if (!segment) continue;
    context.fillStyle = entry.color;
    context.fillRect(cursor, barY, Math.min(segment, pad + barWidth - cursor), barHeight);
    cursor += segment;
  }

  const legendY = 452;
  const columnWidth = barWidth / 2;
  spec.entries.slice(0, 4).forEach((entry, index) => {
    const x = pad + (index % 2) * columnWidth;
    const y = legendY + Math.floor(index / 2) * 40;
    context.fillStyle = entry.color;
    context.beginPath();
    context.arc(x + 8, y - 7, 8, 0, Math.PI * 2);
    context.fill();
    setAnalysisCardFont(context, 22, 700);
    context.fillStyle = '#f3f5f7';
    const share = `${entry.share.toFixed(1)}%`;
    const shareWidth = context.measureText(share).width;
    fitAnalysisCardText(context, entry.label, columnWidth - shareWidth - 64, 22, 14, 600);
    context.fillStyle = '#c9d0d6';
    context.fillText(entry.label, x + 26, y);
    setAnalysisCardFont(context, 22, 800);
    context.fillStyle = '#f3f5f7';
    context.fillText(share, x + columnWidth - shareWidth - 24, y);
  });

  setAnalysisCardFont(context, 18, 600);
  context.fillStyle = '#6f7882';
  context.fillText(spec.footer || '', pad, height - 50);
  drawDomainWatermark(context, { right: width - 48, baseline: height - 50, domain: ANALYSIS_CARD_WATERMARK, font: '800 20px ui-sans-serif, system-ui, sans-serif' });
}

function analysisCardColor(entry) {
  if (entry.kind === 'human') return '#4b5560';
  return getAgentBrand(entry).color;
}

function buildRepositoryCardSpec(payload) {
  const summary = payload?.summary || {};
  const total = Number(summary.changedLines) || 0;
  const aiShare = Number(summary.aiChangedShare) || 0;
  const entries = [
    ...(Array.isArray(payload?.agents) ? payload.agents : []).map((agent) => ({
      label: agent.agentLabel || agent.identity || 'AI agent',
      agentId: agent.agentId,
      identity: agent.agentLabel || agent.identity,
      kind: 'ai',
      changedLines: Number(agent.changedLines) || 0
    })),
    { label: getTranslation('repoAnalysis.cardHumans'), kind: 'human', changedLines: Number(summary.humanChangedLines) || 0 }
  ].filter((entry) => entry.changedLines > 0)
    .map((entry) => ({ ...entry, share: total ? (entry.changedLines / total) * 100 : 0 }))
    .map((entry) => ({ ...entry, color: analysisCardColor(entry) }));
  const fullName = payload?.repository?.fullName || '—';
  return {
    eyebrow: getTranslation('repoAnalysis.cardRepositoryEyebrow'),
    title: fullName,
    subtitle: [payload?.repository?.language, payload?.repository?.stars ? `★ ${formatAnalysisNumber(payload.repository.stars)}` : null].filter(Boolean).join(' · '),
    value: `${aiShare.toFixed(1)}%`,
    valueColor: '#b59cff',
    valueLabel: getTranslation('repoAnalysis.cardAiLabel'),
    valueDetail: getTranslation('repoAnalysis.cardLinesOf')
      .replace('{ai}', formatAnalysisNumber(summary.aiChangedLines))
      .replace('{total}', formatAnalysisNumber(total)),
    entries,
    footer: getTranslation('repoAnalysis.cardFooter')
      .replace('{commits}', formatAnalysisNumber(summary.analyzedCommits))
      .replace('{date}', formatAnalysisSnapshotDate(payload?.fetchedAt)),
    fileName: `ai-countdown-${fullName.replace(/[^A-Za-z0-9_.-]+/g, '-')}.png`
  };
}

function buildProfileCardSpec(payload) {
  const result = payload?.result || {};
  const profile = payload?.profile || result.profile || {};
  const login = payload?.login || result.login || '';
  const total = Number(result.sampledChangedLines) || 0;
  const entries = [
    ...(Array.isArray(result.agents) ? result.agents : []).map((agent) => ({
      label: agent.agentLabel || agent.agentId || 'AI agent',
      agentId: agent.agentId,
      identity: agent.agentLabel,
      kind: 'ai',
      changedLines: Number(agent.changedLines) || 0
    })),
    { label: getTranslation('repoAnalysis.profileHuman').replace('{login}', login), kind: 'human', changedLines: Number(result.contributorChangedLines) || 0 }
  ].filter((entry) => entry.changedLines > 0)
    .map((entry) => ({ ...entry, share: total ? (entry.changedLines / total) * 100 : 0 }))
    .map((entry) => ({ ...entry, color: analysisCardColor(entry) }));
  const aiShare = entries.filter((entry) => entry.kind === 'ai').reduce((sum, entry) => sum + entry.share, 0);
  const statusKey = {
    ok: result.inferredAgentId ? 'profileStatusPrimary' : 'profileStatusOccasional',
    'no-agent': 'profileStatusNone',
    'insufficient-data': 'profileStatusInsufficient',
    unavailable: 'profileStatusUnavailable'
  }[result.status] || 'profileStatusUnavailable';
  return {
    eyebrow: getTranslation('repoAnalysis.cardProfileEyebrow'),
    title: profile.name && profile.name !== login ? profile.name : `@${login}`,
    subtitle: `@${login} · ${getTranslation(`repoAnalysis.${statusKey}`).replace('{agent}', result.likelyAgentLabel || '')}`,
    avatar: profile.avatarUrl || null,
    avatarFallback: login.slice(0, 2).toUpperCase(),
    value: `${aiShare.toFixed(1)}%`,
    valueColor: aiShare > 0 ? '#b59cff' : '#d8ff70',
    valueLabel: getTranslation('repoAnalysis.cardProfileAiLabel'),
    valueDetail: getTranslation('repoAnalysis.profileSample')
      .replace('{repos}', formatAnalysisNumber(result.sampledRepositories || 0))
      .replace('{commits}', formatAnalysisNumber(result.sampledCommits || 0))
      .replace('{lines}', formatAnalysisNumber(total)),
    entries,
    footer: getTranslation('repoAnalysis.cardProfileFooter').replace('{date}', formatAnalysisSnapshotDate(payload?.fetchedAt)),
    fileName: `ai-countdown-${login.replace(/[^A-Za-z0-9_.-]+/g, '-')}.png`
  };
}

async function renderAnalysisCardBlob(spec) {
  const canvas = document.createElement('canvas');
  canvas.width = ANALYSIS_CARD_SIZE.width;
  canvas.height = ANALYSIS_CARD_SIZE.height;
  const context = canvas.getContext('2d');
  const avatar = spec.avatar ? await loadAnalysisCardImage(spec.avatar) : null;
  drawAnalysisCard(context, spec, { avatar });
  try {
    return await new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('empty image'))), 'image/png'));
  } catch (error) {
    // A cross-origin avatar can taint the canvas; redraw with the initials instead.
    drawAnalysisCard(context, spec, {});
    return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('empty image'))), 'image/png'));
  }
}

async function downloadAnalysisCard(kind, button) {
  const payload = kind === 'profile' ? lastContributorAnalysis : lastRepositoryAnalysis;
  if (!payload) return;
  const spec = kind === 'profile' ? buildProfileCardSpec(payload) : buildRepositoryCardSpec(payload);
  if (button) button.disabled = true;
  try {
    const blob = await renderAnalysisCardBlob(spec);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = spec.fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.warn('Could not render the analysis card.', error);
  } finally {
    if (button) button.disabled = false;
  }
}

document.querySelectorAll('[data-download-card]').forEach((button) => {
  button.addEventListener('click', () => downloadAnalysisCard(button.dataset.downloadCard, button));
});

document.querySelector('#repo-analysis-form')?.addEventListener('submit', submitRepositoryAnalysis);

let savedLocale = ROUTE_IS_RUSSIAN ? 'ru' : 'en';
try {
  if (!ROUTE_IS_RUSSIAN) savedLocale = localStorage.getItem('ai-countdown-locale') || 'en';
} catch (error) { /* use the route default */ }

async function initializeApp() {
  configureStaticFrontendLinks();
  updateSiteWatermarks();
  applyLocale(savedLocale);
  await Promise.all([loadCodeIndex(), loadWorkIndex(), loadLifeIndex(), loadRepositoryAnalysisLeaderboard()]);
  animateInitialRings();
  // Prepare the empty rings and intro state before revealing the page. This
  // prevents a stale baseline, source bar, or lower copy from flashing between
  // the API response and the first animation frame.
  requestAnimationFrame(() => document.body.classList.remove('app-pending'));
  loadCombinedSnapshot();
}

initializeApp();
