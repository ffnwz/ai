const OCCUPATION_TEXT = {
  ru: {
    pageTitle: 'AI Countdown — профессии',
    back: 'На главную',
    eyebrow: 'РАБОТА · ОЦЕНКА ПРОФЕССИЙ',
    title: 'Какую часть каждой профессии уже может делать AI',
    lede: 'Профессии международного классификатора ISCO-08, от самых массовых к редким. Для каждой показано, сколько работы берёт на себя нейросеть, а сколько остаётся человеку.',
    medianLabel: 'медиана по профессиям · источник для кольца «Работа»',
    embodied: 'AI — программы, антропоморфный робот или дрон-квадрокоптер с возможностями сегодняшнего дня',
    softwareOnly: 'AI — только программы, без робота и дрона',
    legendAi: 'нейросеть',
    legendHuman: 'человек',
    scale: '0% — AI не может помочь · 50% — справляется с человеком · 100% — работает без человека',
    search: 'Поиск профессии или кода ISCO',
    sortFrequency: 'По частотности',
    sortAiDesc: 'Больше всего AI',
    sortAiAsc: 'Больше всего человека',
    allGroups: 'Все группы',
    methodology: 'Методология',
    version: (date) => `ПРОФЕССИИ · ПРОВЕРКА ${date}`,
    weighted: 'взвешено по занятости',
    countries: (count) => `${count} ${count === 1 ? 'страна' : count < 5 ? 'страны' : 'стран'}`,
    count: (shown, total) => shown === total ? `${total} профессий` : `${shown} из ${total} профессий`,
    employed: 'занятых ≈',
    ai: 'AI',
    human: 'человек',
    unrated: 'нет оценки',
    empty: 'Ничего не найдено.',
    unavailable: 'Оценки профессий пока не загружены.',
    regions: { all: 'Все страны', us: 'США', europe: 'Европа', russia: 'Россия', asia: 'Азия' },
    million: 'млн',
    thousand: 'тыс.',
    meta: (run) => [
      `Оценка: ${run.model} через OpenRouter, ${run.date}, temperature ${run.temperature}, seed ${run.seed}.`,
      `Промпт v${run.promptVersion} · sha256 ${run.prompt}. Классификатор sha256 ${run.classifier}. Файл прогона: ${run.file}.`,
      'Классификатор — ISCO-08 из ESCO API; русские названия — машинный перевод по ОКЗ. Частотность — занятость ILOSTAT по 2-значным группам ISCO-08 (последний год по стране), поровну разделённая между профессиями группы. Нет данных: Китай, Корея, Казахстан, Малайзия, Узбекистан.',
      'Это оценка модели: что AI способен делать сейчас, а не фактическое внедрение. Новые прогоны добавляются отдельными файлами в data/work/ratings/.',
      ...(run.history ? [`История прогонов: ${run.history}.`] : [])
    ]
  },
  en: {
    pageTitle: 'AI Countdown — occupations',
    back: 'Home',
    eyebrow: 'WORK · OCCUPATION RATINGS',
    title: 'How much of each job AI can already do',
    lede: 'ISCO-08 occupations, the international job classification, from the most common to the rarest. Each one shows how much of the work AI takes on and how much is left to people.',
    medianLabel: 'median across occupations · a source for the Work ring',
    embodied: 'AI means software plus a humanoid robot or a quadcopter drone, with what they can do today',
    softwareOnly: 'AI means software only, without a robot or drone',
    legendAi: 'AI',
    legendHuman: 'human',
    scale: '0% — AI cannot help · 50% — AI does it with a person · 100% — AI works without a person',
    search: 'Search an occupation or ISCO code',
    sortFrequency: 'Most common first',
    sortAiDesc: 'Most AI',
    sortAiAsc: 'Most human',
    allGroups: 'All groups',
    methodology: 'Methodology',
    version: (date) => `OCCUPATIONS · CHECKED ${date}`,
    weighted: 'employment-weighted',
    countries: (count) => `${count} ${count === 1 ? 'country' : 'countries'}`,
    count: (shown, total) => shown === total ? `${total} occupations` : `${shown} of ${total} occupations`,
    employed: 'employed ≈',
    ai: 'AI',
    human: 'human',
    unrated: 'not rated',
    empty: 'Nothing found.',
    unavailable: 'Occupation ratings are not loaded yet.',
    regions: { all: 'All countries', us: 'United States', europe: 'Europe', russia: 'Russia', asia: 'Asia' },
    million: 'M',
    thousand: 'K',
    meta: (run) => [
      `Rated by ${run.model} via OpenRouter on ${run.date}, temperature ${run.temperature}, seed ${run.seed}.`,
      `Prompt v${run.promptVersion} · sha256 ${run.prompt}. Classifier sha256 ${run.classifier}. Run file: ${run.file}.`,
      'Classifier: ISCO-08 from the ESCO API; Russian titles are machine translations following OKZ. Frequency: ILOSTAT employment by ISCO-08 sub-major group (latest year per country), split evenly across the group’s occupations. No data: China, Korea, Kazakhstan, Malaysia, Uzbekistan.',
      'These are model judgements of what AI can do now, not observed adoption. New runs are added as separate files in data/work/ratings/.',
      ...(run.history ? [`Run history: ${run.history}.`] : [])
    ]
  }
};

let occupationLocale = 'ru';
let occupationData = null;

function text(key) {
  return OCCUPATION_TEXT[occupationLocale][key];
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function formatPeople(value) {
  const number = Number(value) || 0;
  const locale = occupationLocale === 'ru' ? 'ru-RU' : 'en-US';
  if (number >= 1e6) return `${(number / 1e6).toLocaleString(locale, { maximumFractionDigits: 1 })} ${text('million')}`;
  return `${Math.round(number / 1e3).toLocaleString(locale)} ${text('thousand')}`;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return value || '—';
  return date.toLocaleDateString(occupationLocale === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
}

function occupationTitle(occupation) {
  return occupationLocale === 'ru' && occupation.titleRu ? occupation.titleRu : occupation.title;
}

function renderSummary() {
  const summary = occupationData?.summary;
  document.querySelector('#occupations-median').textContent = summary ? `${Number(summary.value).toFixed(0)}%` : '—';
  const embodied = (summary?.run?.embodiment || []).length > 1;
  document.querySelector('#occupations-assumption').textContent = summary ? text(embodied ? 'embodied' : 'softwareOnly') : '';
  document.querySelector('#occupations-version').textContent = summary ? text('version')(formatDate(summary.run.checkedDate)) : text('version')('—');
  const regions = summary?.regions || {};
  document.querySelector('#occupations-regions').innerHTML = ['us', 'europe', 'russia', 'asia', 'all']
    .filter((id) => regions[id])
    .map((id) => {
      const region = regions[id];
      const countries = id === 'all' ? '' : ` · ${text('countries')(region.countries)}`;
      return `<div class="occupations-region"><b>${Number(region.weightedMean).toFixed(0)}%</b><span>${escapeHtml(text('regions')[id])}</span><small>${text('weighted')}${countries}</small></div>`;
    })
    .join('');
}

function renderGroupOptions() {
  const select = document.querySelector('#occupations-group');
  const selected = select.value;
  const groups = new Map();
  for (const occupation of occupationData?.occupations || []) {
    if (occupation.majorGroup) groups.set(occupation.majorGroup.code, occupation.majorGroup.title);
  }
  select.innerHTML = `<option value="">${escapeHtml(text('allGroups'))}</option>${[...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([code, title]) => `<option value="${escapeHtml(code)}">${escapeHtml(code)} · ${escapeHtml(title)}</option>`)
    .join('')}`;
  select.value = selected;
}

function renderList() {
  const list = document.querySelector('#occupations-list');
  const empty = document.querySelector('#occupations-empty');
  const occupations = occupationData?.occupations || [];
  const query = document.querySelector('#occupations-search').value.trim().toLowerCase();
  const group = document.querySelector('#occupations-group').value;
  const sort = document.querySelector('#occupations-sort').value;

  const shown = occupations
    .filter((occupation) => !group || occupation.majorGroup?.code === group)
    .filter((occupation) => !query || [occupation.code, occupation.title, occupation.titleRu].some((value) => String(value || '').toLowerCase().includes(query)))
    .sort((left, right) => {
      if (sort === 'ai-desc') return (right.score ?? -1) - (left.score ?? -1) || left.rank - right.rank;
      if (sort === 'ai-asc') return (left.score ?? 101) - (right.score ?? 101) || left.rank - right.rank;
      return left.rank - right.rank;
    });

  document.querySelector('#occupations-count').textContent = occupations.length ? text('count')(shown.length, occupations.length) : '';
  empty.hidden = Boolean(shown.length) || !occupations.length;
  empty.textContent = text('empty');
  if (!occupations.length) {
    empty.hidden = false;
    empty.textContent = text('unavailable');
  }

  list.innerHTML = shown.map((occupation) => {
    const rated = Number.isFinite(occupation.score);
    const ai = rated ? occupation.score : 0;
    const secondary = occupationLocale === 'ru' && occupation.titleRu ? occupation.title : (occupation.subMajorGroup?.title || '');
    const bar = rated
      ? `<div class="occupations-bar" role="img" aria-label="${escapeHtml(`${text('ai')} ${ai}%, ${text('human')} ${100 - ai}%`)}">
          <span class="ai" style="width:${ai}%"></span><span class="human" style="width:${100 - ai}%"></span>
        </div>
        <div class="occupations-bar-labels"><span class="ai">${text('ai')} ${ai}%</span><span class="human">${text('human')} ${100 - ai}%</span></div>`
      : `<div class="occupations-bar unrated"></div><div class="occupations-bar-labels"><span>${text('unrated')}</span></div>`;
    return `<li class="occupations-row">
      <span class="occupations-rank">${occupation.rank}</span>
      <div class="occupations-name">
        <b>${escapeHtml(occupationTitle(occupation))}</b>
        <small>ISCO ${escapeHtml(occupation.code)} · ${escapeHtml(secondary)}</small>
        ${occupation.rationale ? `<p>${escapeHtml(occupation.rationale)}</p>` : ''}
      </div>
      <span class="occupations-employment">${text('employed')} ${formatPeople(occupation.employmentEstimate)}</span>
      <div class="occupations-share">${bar}</div>
    </li>`;
  }).join('');
}

function renderMeta() {
  const summary = occupationData?.summary;
  const meta = document.querySelector('#occupations-meta');
  if (!summary) {
    meta.innerHTML = '';
    return;
  }
  const lines = text('meta')({
    model: escapeHtml(summary.run.model),
    date: escapeHtml(summary.run.checkedDate),
    temperature: escapeHtml(occupationData.request?.temperature ?? '—'),
    seed: escapeHtml(occupationData.request?.seed ?? '—'),
    promptVersion: escapeHtml(summary.run.promptVersion ?? '—'),
    prompt: `<code>${escapeHtml(String(summary.run.promptSha256 || '').slice(0, 12))}</code>`,
    classifier: `<code>${escapeHtml(String(summary.run.classifierSha256 || '').slice(0, 12))}</code>`,
    file: `<code>${escapeHtml(summary.run.file)}</code>`,
    history: (summary.history || []).length > 1
      ? summary.history.map((item) => `${escapeHtml(item.checkedDate)} p${escapeHtml(item.promptVersion ?? '?')} — ${Number(item.value).toFixed(0)}%`).join(' · ')
      : ''
  });
  meta.innerHTML = lines.map((line) => `<p>${line}</p>`).join('');
}

function applyOccupationLocale(locale) {
  occupationLocale = locale === 'en' ? 'en' : 'ru';
  document.documentElement.lang = occupationLocale;
  document.title = text('pageTitle');
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const value = text(element.dataset.i18n);
    if (typeof value === 'string') element.textContent = value;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = text(element.dataset.i18nPlaceholder);
  });
  document.querySelector('.methodology-locale').setAttribute('aria-label', occupationLocale === 'ru' ? 'Язык' : 'Language');
  document.querySelectorAll('[data-locale]').forEach((button) => {
    const active = button.dataset.locale === occupationLocale;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  try { localStorage.setItem('ai-countdown-locale', occupationLocale); } catch (error) { /* storage may be unavailable */ }
  renderSummary();
  renderGroupOptions();
  renderList();
  renderMeta();
}

async function loadOccupations() {
  try {
    const response = await fetch('/api/work-occupations', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error(`Work occupations API returned ${response.status}`);
    occupationData = await response.json();
  } catch (error) {
    console.warn('Occupation ratings unavailable.', error);
    occupationData = null;
  }
  applyOccupationLocale(occupationLocale);
}

document.querySelectorAll('[data-locale]').forEach((button) => button.addEventListener('click', () => applyOccupationLocale(button.dataset.locale)));
document.querySelector('#occupations-search').addEventListener('input', renderList);
document.querySelector('#occupations-group').addEventListener('change', renderList);
document.querySelector('#occupations-sort').addEventListener('change', renderList);

try { occupationLocale = localStorage.getItem('ai-countdown-locale') || 'ru'; } catch (error) { /* use Russian fallback */ }
applyOccupationLocale(occupationLocale);
loadOccupations();
