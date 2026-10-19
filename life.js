const AI_COUNTDOWN_BACKEND_ORIGIN = 'https://ai.ffnwz.lat';
const IS_GITHUB_PAGES = /(^|\.)github\.io$/i.test(window.location.hostname);
const API_ORIGIN = IS_GITHUB_PAGES ? AI_COUNTDOWN_BACKEND_ORIGIN : '';
const apiUrl = (path) => `${API_ORIGIN}${path}`;

const LIFE_TEXT = {
  ru: {
    pageTitle: 'AI Countdown — повседневные задачи', back: 'На главную', eyebrow: 'ЖИЗНЬ · ПОВСЕДНЕВНЫЕ ЗАДАЧИ',
    title: 'Какие бытовые дела уже могут выполнять AI и устройства',
    lede: 'Собираем повторяющиеся домашние и личные организационные задачи, их частотность, типичную длительность и доступные механизмы автоматизации. Оценка показывает способность выполнить всю задачу, включая подготовку и проверку.',
    medianLabel: 'доля домашнего времени, которую может взять AI: среднее по задачам, взвешенное по минутам в год · источник кольца «Жизнь»',
    methodNote: 'Годовая нагрузка задачи — повторения в год × типичные минуты × доля домохозяйств, где задача вообще есть (выгул собаки — только там, где есть собака). Это прозрачные редакционные допущения; их можно заменить данными опросов.',
    legendAi: 'AI или устройство', legendHuman: 'человек',
    scale: '0% — не может выполнить · 50% — помогает, но человек участвует · 100% — доводит задачу без человека',
    search: 'Поиск задачи или устройства', all: 'Все частоты', sortFrequency: 'По годовой нагрузке', sortAiDesc: 'Больше всего AI', sortAiAsc: 'Больше всего человека',
    count: (shown, total) => `${shown} из ${total} задач`, empty: 'Ничего не найдено.', unavailable: 'Данные задач пока недоступны.',
    unrated: 'модель ещё не оценила', ai: 'AI/устройство', human: 'человек', annual: 'мин. в год', minutes: 'мин. за раз', households: (share) => `в ${share}% домохозяйств`, devices: 'устройства',
    version: (date) => `ЗАДАЧИ · СНИМОК ${date || '—'}`, model: (model) => `модель: ${model}`, run: (date) => `опрос: ${date}`,
    coverage: (scored, total) => `оценено ${scored}/${total}`, history: 'история', methodology: 'Методология',
    contributeEyebrow: 'ОТКРЫТЫЙ ДАТАСЕТ', contributeTitle: 'Нашли ещё одну повседневную задачу?',
    contributeCopy: 'Опишите её вместе с частотностью, типичным временем и устройствами или механизмами в готовой Issue на GitHub.',
    contributeLink: 'Предложить метрику'
  },
  en: {
    pageTitle: 'AI Countdown — everyday tasks', back: 'Home', eyebrow: 'LIFE · EVERYDAY TASKS',
    title: 'Which everyday tasks can AI and devices already do',
    lede: 'We collect recurring household and personal-administration tasks, their frequency, typical duration, and available automation mechanisms. The score covers the complete task, including setup and checking.',
    medianLabel: 'share of household time AI can take on: task scores averaged by annual minutes · source for the Life ring',
    methodNote: 'A task’s annual workload is occurrences per year × typical minutes × the share of households where the task exists (a dog walk only where there is a dog). These are transparent editorial assumptions that survey data can replace.',
    legendAi: 'AI or device', legendHuman: 'human',
    scale: '0% — cannot complete · 50% — helps, but a person participates · 100% — completes the task without a person',
    search: 'Search task or device', all: 'All frequencies', sortFrequency: 'Annual workload', sortAiDesc: 'Most AI', sortAiAsc: 'Most human',
    count: (shown, total) => `${shown} of ${total} tasks`, empty: 'Nothing found.', unavailable: 'Task data is not available yet.',
    unrated: 'not rated yet', ai: 'AI/device', human: 'human', annual: 'min/year', minutes: 'min each', households: (share) => `in ${share}% of households`, devices: 'devices',
    version: (date) => `TASKS · SNAPSHOT ${date || '—'}`, model: (model) => `model: ${model}`, run: (date) => `run: ${date}`,
    coverage: (scored, total) => `${scored}/${total} rated`, history: 'history', methodology: 'Methodology',
    contributeEyebrow: 'OPEN DATASET', contributeTitle: 'Found another everyday task?',
    contributeCopy: 'Describe it with its frequency, typical time, and devices or mechanisms in a ready-to-fill GitHub Issue.',
    contributeLink: 'Suggest a metric'
  }
};

let locale = 'ru';
let payload = null;
const text = (key) => LIFE_TEXT[locale][key] ?? key;
const esc = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const number = (value) => Number.isFinite(Number(value)) ? Number(value).toLocaleString(locale) : '—';
const taskTitle = (task) => locale === 'ru' ? task.titleRu : task.titleEn;
const frequencyLabel = (frequency) => payload?.frequencyScale?.[frequency]?.[locale === 'ru' ? 'labelRu' : 'labelEn'] || frequency;

function applyLocale(next) {
  locale = next === 'en' ? 'en' : 'ru';
  document.documentElement.lang = locale;
  document.title = text('pageTitle');
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = typeof text(element.dataset.i18n) === 'function' ? '' : text(element.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => { element.placeholder = text(element.dataset.i18nPlaceholder); });
  document.querySelector('.methodology-locale').setAttribute('aria-label', locale === 'ru' ? 'Язык' : 'Language');
  document.querySelectorAll('[data-locale]').forEach((button) => { const active = button.dataset.locale === locale; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  try { localStorage.setItem('ai-countdown-locale', locale); } catch (error) { /* fallback */ }
  renderAll();
}

function renderSummary() {
  const summary = payload?.summary;
  document.querySelector('#life-median').textContent = Number.isFinite(Number(summary?.value)) ? `${Number(summary.value).toFixed(1)}%` : '—';
  document.querySelector('#life-assumption').textContent = summary ? text('coverage')(summary.coverage?.scored || 0, summary.coverage?.tasks || 0) : '';
  document.querySelector('#life-version').textContent = text('version')(summary?.run?.checkedDate);
}

function renderFrequencyOptions() {
  const select = document.querySelector('#life-frequency');
  const selected = select.value;
  const frequencies = [...new Set((payload?.tasks || []).map((task) => task.frequency).filter(Boolean))];
  select.innerHTML = `<option value="">${esc(text('all'))}</option>${frequencies.map((frequency) => `<option value="${esc(frequency)}">${esc(frequencyLabel(frequency))}</option>`).join('')}`;
  select.value = selected;
}

function renderList() {
  const tasks = payload?.tasks || [];
  const query = document.querySelector('#life-search').value.trim().toLowerCase();
  const frequency = document.querySelector('#life-frequency').value;
  const sort = document.querySelector('#life-sort').value;
  const shown = tasks.filter((task) => !frequency || task.frequency === frequency).filter((task) => !query || [task.id, task.titleRu, task.titleEn, ...(task.devices || [])].join(' ').toLowerCase().includes(query)).sort((left, right) => {
    if (sort === 'ai-desc') return (right.score ?? -1) - (left.score ?? -1) || right.annualMinutes - left.annualMinutes;
    if (sort === 'ai-asc') return (left.score ?? 101) - (right.score ?? 101) || right.annualMinutes - left.annualMinutes;
    return right.annualMinutes - left.annualMinutes;
  });
  document.querySelector('#life-count').textContent = tasks.length ? text('count')(shown.length, tasks.length) : '';
  const empty = document.querySelector('#life-empty');
  empty.hidden = Boolean(shown.length) || !tasks.length;
  empty.textContent = tasks.length ? text('empty') : text('unavailable');
  document.querySelector('#life-list').innerHTML = shown.map((task, index) => {
    const rated = Number.isFinite(Number(task.score));
    const ai = rated ? Number(task.score) : 0;
    const devices = (task.devices || []).filter((device) => device !== 'none').join(' · ');
    const bar = rated ? `<div class="occupations-bar" aria-label="${esc(`${text('ai')} ${ai}%, ${text('human')} ${100 - ai}%`)}"><span class="ai" style="width:${ai}%"></span><span class="human" style="width:${100 - ai}%"></span></div><div class="occupations-bar-labels"><span class="ai">${text('ai')} ${ai}%</span><span class="human">${text('human')} ${100 - ai}%</span></div>` : `<div class="occupations-bar unrated"></div><div class="occupations-bar-labels"><span>${text('unrated')}</span></div>`;
    return `<li class="occupations-row life-row"><span class="occupations-rank">${index + 1}</span><div class="occupations-name"><b>${esc(taskTitle(task))}</b><small>${esc(frequencyLabel(task.frequency))} · ${number(task.occurrencesPerYear)}×/year · ${number(task.typicalMinutes)} ${text('minutes')}${Number(task.householdShare) < 1 ? ` · ${esc(text('households')(Math.round(Number(task.householdShare) * 100)))}` : ''} · ${devices ? `${esc(text('devices'))}: ${esc(devices)}` : ''}</small>${task.rationale ? `<p>${esc(task.rationale)}</p>` : ''}</div><span class="occupations-employment">${number(task.annualMinutes)} ${text('annual')}</span><div class="occupations-share">${bar}</div></li>`;
  }).join('');
}

function renderMeta() {
  const meta = document.querySelector('#life-meta');
  const summary = payload?.summary;
  if (!summary) { meta.innerHTML = ''; return; }
  const history = (summary.history || []).length > 1 ? `${text('history')}: ${summary.history.map((item) => `${esc(item.checkedDate)} — ${Number(item.value).toFixed(1)}%`).join(' · ')}` : '';
  meta.innerHTML = [`${text('model')(esc(summary.run.model))}`, `${text('run')(esc(summary.run.checkedDate))}`, `${text('coverage')(summary.coverage?.scored || 0, summary.coverage?.tasks || 0)}`, history, esc(summary.note || '')].filter(Boolean).map((line) => `<p>${line}</p>`).join('');
}

function renderAll() { renderSummary(); renderFrequencyOptions(); renderList(); renderMeta(); }

async function load() {
  try {
    const response = await fetch(apiUrl('/api/life-tasks'), { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error(`Life tasks API returned ${response.status}`);
    payload = await response.json();
  } catch (error) {
    console.warn('Life task data unavailable.', error);
    payload = null;
  }
  applyLocale(locale);
}

document.querySelectorAll('[data-locale]').forEach((button) => button.addEventListener('click', () => applyLocale(button.dataset.locale)));
document.querySelector('#life-search').addEventListener('input', renderList);
document.querySelector('#life-frequency').addEventListener('change', renderList);
document.querySelector('#life-sort').addEventListener('change', renderList);
try { locale = localStorage.getItem('ai-countdown-locale') || 'ru'; } catch (error) { /* fallback */ }
load();
