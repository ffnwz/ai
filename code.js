const AI_COUNTDOWN_BACKEND_ORIGIN = 'https://ai.ffnwz.lat';
const IS_GITHUB_PAGES = /(^|\.)github\.io$/i.test(window.location.hostname);
const API_ORIGIN = IS_GITHUB_PAGES ? AI_COUNTDOWN_BACKEND_ORIGIN : '';

const CODE_TEXT = {
  ru: {
    pageTitle: 'AI Countdown — просканированные репозитории',
    back: 'На главную',
    eyebrow: 'КОД · ПУБЛИЧНЫЕ РЕПОЗИТОРИИ',
    title: 'Все репозитории, которые мы просканировали',
    lede: 'История публичных коммитов, статистика изменений и найденные AI-агенты. Каждый новый анализ сохраняется, чтобы сравнивать результат во времени.',
    repositoryCount: 'просканированных репозитория',
    methodNote: 'Доля AI — это доля изменённых строк в обработанной публичной истории. Коммит с агентом относится агенту целиком; после него до трёх безагентных коммитов в разные дни действует временная атрибуция, затем следующий коммит снова считается собственным.',
    search: 'Поиск репозитория или языка',
    sortAi: 'Больше всего AI-кода',
    sortLines: 'Больше всего изменённых строк',
    sortRecent: 'Последний анализ',
    count: (shown, total) => shown === total ? `${total} репозитория` : `${shown} из ${total} репозиториев`,
    empty: 'По этому запросу репозитории не найдены.',
    unavailable: 'История анализов пока недоступна.',
    analyzed: 'анализ',
    aiLines: 'AI изменил строк',
    totalLines: 'всего изменено строк',
    commits: 'коммитов',
    coverage: 'покрытие истории',
    lastAnalysis: 'последний анализ',
    noAi: 'AI-сигнал не найден',
    methodology: 'Методология',
    meta: (payload) => [
      payload?.updatedAt ? `Список обновлён ${formatDate(payload.updatedAt)}` : '',
      'История хранится backend-ом; новый анализ запускается не чаще одного раза в сутки для репозитория.'
    ].filter(Boolean).join(' · ')
  },
  en: {
    pageTitle: 'AI Countdown — scanned repositories',
    back: 'Home',
    eyebrow: 'CODE · PUBLIC REPOSITORIES',
    title: 'Every repository we have scanned',
    lede: 'Public commit history, change statistics, and detected AI agents. Each analysis is saved so the result can be compared over time.',
    repositoryCount: 'scanned repositories',
    methodNote: 'AI share is the share of changed lines in the processed public history. A commit with an agent is assigned to that agent; after it, up to three agent-free commits on different days stay in the temporal attribution, then the next commit is human-owned again.',
    search: 'Search repository or language',
    sortAi: 'Most AI code',
    sortLines: 'Most changed lines',
    sortRecent: 'Latest analysis',
    count: (shown, total) => shown === total ? `${total} repositories` : `${shown} of ${total} repositories`,
    empty: 'No repositories match this search.',
    unavailable: 'Analysis history is not available yet.',
    analyzed: 'analysis',
    aiLines: 'AI changed lines',
    totalLines: 'total changed lines',
    commits: 'commits',
    coverage: 'history coverage',
    lastAnalysis: 'last analysis',
    noAi: 'No AI signal found',
    methodology: 'Methodology',
    meta: (payload) => [
      payload?.updatedAt ? `List updated ${formatDate(payload.updatedAt)}` : '',
      'History is stored by the backend; a new repository analysis runs at most once a day.'
    ].filter(Boolean).join(' · ')
  }
};

let locale = 'ru';
let payload = null;
let repositories = [];

function apiUrl(path) { return `${API_ORIGIN}${path}`; }
function text(key) { return CODE_TEXT[locale][key]; }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}
function formatNumber(value) { return Number(value || 0).toLocaleString(locale); }
function formatDate(value) {
  const timestamp = Date.parse(value || '');
  if (!Number.isFinite(timestamp)) return '—';
  return new Date(timestamp).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
function relativeDate(value) {
  const timestamp = Date.parse(value || '');
  if (!Number.isFinite(timestamp)) return '—';
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
  if (locale === 'en') return days === 0 ? 'today' : days === 1 ? '1 day ago' : days < 30 ? `${days} days ago` : days < 365 ? `${Math.floor(days / 30)} months ago` : `${Math.floor(days / 365)} years ago`;
  return days === 0 ? 'сегодня' : days === 1 ? '1 день назад' : days < 5 ? `${days} дня назад` : days < 30 ? `${days} дней назад` : days < 365 ? `${Math.floor(days / 30)} мес. назад` : `${Math.floor(days / 365)} г. назад`;
}
function applyLocale(nextLocale) {
  locale = CODE_TEXT[nextLocale] ? nextLocale : 'ru';
  document.documentElement.lang = locale;
  document.title = text('pageTitle');
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = text(element.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => { element.placeholder = text(element.dataset.i18nPlaceholder); });
  render();
  try { localStorage.setItem('ai-countdown-locale', locale); } catch (error) { /* localStorage may be unavailable */ }
  document.querySelectorAll('[data-locale]').forEach((button) => {
    const selected = button.dataset.locale === locale;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
function sortRepositories(items) {
  const mode = document.querySelector('#code-sort')?.value || 'ai';
  return [...items].sort((left, right) => {
    if (mode === 'lines') return (Number(right.summary?.changedLines) || 0) - (Number(left.summary?.changedLines) || 0);
    if (mode === 'recent') return Date.parse(right.fetchedAt || '') - Date.parse(left.fetchedAt || '');
    return (Number(right.summary?.aiChangedShare) || 0) - (Number(left.summary?.aiChangedShare) || 0)
      || (Number(right.summary?.aiChangedLines) || 0) - (Number(left.summary?.aiChangedLines) || 0);
  });
}
function renderCard(item, index) {
  const repository = item.repository || {};
  const summary = item.summary || {};
  const share = Number.isFinite(Number(summary.aiChangedShare)) ? Number(summary.aiChangedShare) : null;
  const aiLines = Number(summary.aiChangedLines) || 0;
  const changedLines = Number(summary.changedLines) || 0;
  const width = Math.max(0, Math.min(100, share || 0));
  const url = repository.url || `https://github.com/${repository.fullName || ''}`;
  const agents = Array.isArray(item.agents) ? item.agents.filter((agent) => agent.changedLines > 0) : [];
  const agentLabel = agents.length
    ? agents.map((agent) => `${escapeHtml(agent.identity)}${Number.isFinite(Number(agent.changedShare)) ? ` ${Number(agent.changedShare).toLocaleString(locale, { maximumFractionDigits: 1 })}%` : ''}`).join(' · ')
    : text('noAi');
  return `<a class="code-repository-card" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">
    <div class="code-repository-card-head"><span class="code-repository-rank">${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(repository.fullName || 'Unknown repository')}</strong><small>${escapeHtml(repository.language || 'GitHub')} · ${relativeDate(item.fetchedAt)}</small></div><b class="code-repository-share">${share === null ? '—' : `${share.toLocaleString(locale, { maximumFractionDigits: 1 })}%`}</b></div>
    <div class="code-repository-bar" aria-hidden="true"><i style="width:${width}%"></i></div>
    <div class="code-repository-stats"><span>${formatNumber(aiLines)} ${text('aiLines')}</span><span>${formatNumber(changedLines)} ${text('totalLines')}</span><span>${formatNumber(summary.analyzedCommits || summary.commits)} ${text('commits')}</span></div>
    <small class="code-repository-agents">${agentLabel}</small>
    <small class="code-repository-meta">${text('lastAnalysis')}: ${formatDate(item.fetchedAt)} · ${summary.statsCoverage ?? '—'}% ${text('coverage')}</small>
  </a>`;
}
function render() {
  const search = String(document.querySelector('#code-search')?.value || '').trim().toLowerCase();
  const filtered = sortRepositories(repositories).filter((item) => {
    const repository = item.repository || {};
    return !search || `${repository.fullName || ''} ${repository.language || ''}`.toLowerCase().includes(search);
  });
  const list = document.querySelector('#code-repository-list');
  const empty = document.querySelector('#code-empty');
  const count = document.querySelector('#code-count');
  if (count) count.textContent = text('count')(filtered.length, repositories.length);
  if (list) list.innerHTML = filtered.map(renderCard).join('');
  if (empty) { empty.hidden = filtered.length > 0; empty.textContent = repositories.length ? text('empty') : text('unavailable'); }
  const meta = document.querySelector('#code-meta');
  if (meta) meta.innerHTML = payload ? `<p>${escapeHtml(text('meta')(payload))}</p><p>${escapeHtml(locale === 'ru' ? 'Подробный результат каждого репозитория доступен на главной странице через форму анализа.' : 'The detailed result for each repository is available through the analysis form on the home page.')}</p>` : '';
  const repositoryCount = document.querySelector('#code-repository-count');
  if (repositoryCount) repositoryCount.textContent = formatNumber(repositories.length);
  const updated = document.querySelector('#code-page-updated');
  if (updated) updated.textContent = payload?.updatedAt ? `${text('lastAnalysis')}: ${formatDate(payload.updatedAt)}` : '';
}
async function load() {
  try {
    const response = await fetch(apiUrl('/api/repository-analyses'), { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error(`Repository history API returned ${response.status}`);
    payload = await response.json();
    repositories = Array.isArray(payload.repositories) ? payload.repositories : [];
  } catch (error) {
    payload = null;
    repositories = [];
    console.warn('Repository history unavailable.', error);
  }
  render();
}

document.querySelector('#code-search')?.addEventListener('input', render);
document.querySelector('#code-sort')?.addEventListener('change', render);
document.querySelectorAll('[data-locale]').forEach((button) => button.addEventListener('click', () => applyLocale(button.dataset.locale)));
let storedLocale = 'ru';
try { storedLocale = localStorage.getItem('ai-countdown-locale') || 'ru'; } catch (error) { /* use Russian fallback */ }
applyLocale(storedLocale);
load();
