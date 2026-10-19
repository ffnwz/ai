#!/usr/bin/env node

// Read-only repository review helper for local operations.
// It never prints the GitHub token. Public endpoints remain usable without one,
// but a token gives a much higher rate limit for issue/PR checks.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const API_ROOT = 'https://api.github.com';
let anonymousFallback = false;
let warnedAboutToken = false;

function loadDotEnv(filePath) {
  try {
    const contents = fs.readFileSync(filePath, 'utf8');
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
    if (error.code !== 'ENOENT') throw error;
  }
}

function parseArgs(argv) {
  const args = { repo: process.env.GITHUB_REPOSITORY || 'ffnwz/ai', limit: 20, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--repo') args.repo = argv[++index] || args.repo;
    else if (value === '--limit') args.limit = Math.max(0, Number(argv[++index]) || 0);
    else if (value === '--json') args.json = true;
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(args.repo)) throw new Error(`Invalid GitHub repository: ${args.repo}`);
  return args;
}

async function githubJson(endpoint) {
  const token = anonymousFallback ? '' : (process.env.GITHUB_TOKEN || process.env.GITHUB_FFNWZ_API_TOKEN || '');
  const response = await fetch(`${API_ROOT}${endpoint}`, {
    headers: {
      accept: 'application/vnd.github+json',
      'user-agent': 'AI-Countdown-local-review',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    }
  });
  const body = await response.text();
  let payload;
  try { payload = JSON.parse(body); } catch { payload = { message: body.slice(0, 300) }; }
  if (response.status === 401 && token) {
    anonymousFallback = true;
    if (!warnedAboutToken) {
      warnedAboutToken = true;
      console.warn('GITHUB_TOKEN was rejected; retrying public GitHub requests without authentication.');
    }
    return githubJson(endpoint);
  }
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${payload.message || 'request failed'}`);
  return payload;
}

function summarizeChecks(checkRuns, statuses) {
  const runs = Array.isArray(checkRuns) ? checkRuns : [];
  const statusRows = Array.isArray(statuses) ? statuses : [];
  const failing = runs.filter((run) => ['failure', 'cancelled', 'timed_out', 'action_required', 'startup_failure'].includes(run.conclusion));
  const pending = runs.filter((run) => run.status !== 'completed');
  const successful = runs.filter((run) => run.status === 'completed' && !failing.includes(run));
  const statusFailures = statusRows.filter((status) => ['failure', 'error'].includes(status.state));
  return {
    total: runs.length + statusRows.length,
    successful: successful.length + statusRows.filter((status) => status.state === 'success').length,
    pending: pending.length + statusRows.filter((status) => status.state === 'pending').length,
    failing: failing.length + statusFailures.length,
    names: [...runs.map((run) => run.name), ...statusRows.map((status) => status.context)]
  };
}

async function inspectPullRequest(repo, pullRequest) {
  try {
    const [checks, statuses] = await Promise.all([
      githubJson(`/repos/${repo}/commits/${encodeURIComponent(pullRequest.head.sha)}/check-runs?per_page=100`),
      githubJson(`/repos/${repo}/commits/${encodeURIComponent(pullRequest.head.sha)}/status`)
    ]);
    return {
      number: pullRequest.number,
      title: pullRequest.title,
      url: pullRequest.html_url,
      draft: Boolean(pullRequest.draft),
      author: pullRequest.user?.login || null,
      updatedAt: pullRequest.updated_at,
      headSha: pullRequest.head.sha,
      checks: summarizeChecks(checks.check_runs, statuses.statuses)
    };
  } catch (error) {
    return {
      number: pullRequest.number,
      title: pullRequest.title,
      url: pullRequest.html_url,
      draft: Boolean(pullRequest.draft),
      author: pullRequest.user?.login || null,
      updatedAt: pullRequest.updated_at,
      headSha: pullRequest.head.sha,
      checks: null,
      error: error.message
    };
  }
}

async function main() {
  loadDotEnv(path.join(ROOT, '.env'));
  const args = parseArgs(process.argv.slice(2));
  const repository = await githubJson(`/repos/${args.repo}`);
  const [issueRows, pullRows] = await Promise.all([
    githubJson(`/repos/${args.repo}/issues?state=open&per_page=100&sort=updated&direction=desc`),
    githubJson(`/repos/${args.repo}/pulls?state=open&per_page=100&sort=updated&direction=desc`)
  ]);
  const issues = issueRows.filter((item) => !item.pull_request).map((item) => ({
    number: item.number,
    title: item.title,
    url: item.html_url,
    labels: (item.labels || []).map((label) => label.name),
    updatedAt: item.updated_at
  }));
  const pullRequests = await Promise.all(pullRows.slice(0, args.limit).map((item) => inspectPullRequest(args.repo, item)));
  const result = {
    repository: { fullName: repository.full_name, defaultBranch: repository.default_branch, visibility: repository.visibility },
    fetchedAt: new Date().toISOString(),
    issues: { total: issues.length, items: issues },
    pullRequests: { total: pullRows.length, checked: pullRequests.length, items: pullRequests },
    summary: {
      failingPullRequests: pullRequests.filter((item) => item.checks?.failing > 0).length,
      pendingPullRequests: pullRequests.filter((item) => item.checks?.pending > 0).length,
      unavailableChecks: pullRequests.filter((item) => !item.checks).length
    }
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`GitHub review: ${result.repository.fullName}`);
    console.log(`Open issues: ${issues.length}`);
    for (const issue of issues) console.log(`  #${issue.number} ${issue.title} · ${issue.url}`);
    console.log(`Open pull requests: ${pullRows.length} · checks inspected: ${pullRequests.length}`);
    for (const pullRequest of pullRequests) {
      const checks = pullRequest.checks;
      const checkLabel = checks
        ? `${checks.successful}/${checks.total} passed${checks.pending ? `, ${checks.pending} pending` : ''}${checks.failing ? `, ${checks.failing} failing` : ''}`
        : `checks unavailable${pullRequest.error ? `: ${pullRequest.error}` : ''}`;
      console.log(`  #${pullRequest.number} ${pullRequest.title} · ${checkLabel} · ${pullRequest.url}`);
    }
  }

  if (result.summary.failingPullRequests) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`GitHub review failed: ${error.message}`);
  process.exitCode = 1;
});
