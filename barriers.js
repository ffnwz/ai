const BARRIERS_COPY = {
  ru: {
    back: 'На главную',
    toolbar: 'РОБОТЫ · ЖИЗНЬ + РАБОТА',
    eyebrow: 'РОБОТЫ · КАРТА БАРЬЕРОВ',
    title: 'Что не даёт нам поставить универсального робота рядом с человеком',
    lede: 'AI уже умеет видеть, объяснять и планировать. Но робот должен ещё безопасно трогать мир, выдерживать ошибки, работать часами и окупаться. Собираем главные разрывы между демонстрацией и повседневной надёжностью.',
    kpi: {
      overallLabel: 'СРЕДНЯЯ ГОТОВНОСТЬ', overallNote: 'редакционная оценка по 10 барьерам',
      countLabel: 'КЛЮЧЕВЫХ БАРЬЕРОВ', countNote: 'от физики до экономики',
      closedLabel: 'ПОЛНОСТЬЮ ЗАКРЫТО', closedNote: 'на открытой шкале пока нет'
    },
    reading: { eyebrow: 'КАК ЧИТАТЬ ШКАЛУ', title: 'Это не прогноз даты. Это карта узких мест.', copy: '100% означает не красивое видео, а устойчивую работу в разнообразных реальных условиях: с ошибками, редкими случаями, обслуживанием и безопасностью. Проценты — наша прозрачная редакционная шкала, которую можно обновлять по новым данным.' },
    resolved: { eyebrow: 'ЗАКРЫТО В УЗКОЙ ПОСТАНОВКЕ', title: 'Что уже можно пометить как 100%', copy: 'Здесь 100% означает: конкретная функция доказана или стандартизирована в обозначенных условиях. Это не означает, что универсальный робот уже решает ту же задачу в любом доме, цехе или рядом с любым человеком.', boundary: 'Граница', source: 'Источник' },
    barriers: { eyebrow: 'ГЛАВНЫЕ РАЗРЫВЫ', title: 'Что ещё приходится доказывать' },
    filters: { all: 'Все', life: 'Жизнь', work: 'Работа' },
    frontier: { eyebrow: 'ГДЕ МЫ СЕЙЧАС', title: 'Среда важнее формы робота', copy: 'Один и тот же робот может выглядеть почти готовым в цехе и беспомощным на кухне. Главный фактор — сколько неопределённости, людей и исключений находится вокруг него.' },
    materials: { eyebrow: 'МАТЕРИАЛЫ', title: 'С чего начинать проверку', copy: 'Ниже — не рекламный рейтинг, а короткий набор первичных материалов: лабораторные результаты, стандарты безопасности и статистика реально установленных роботов.' },
    research: { eyebrow: 'ИССЛЕДОВАНИЯ И BENCHMARKS', title: 'Чем проверять прогресс', copy: 'Эти работы полезны как карта измерений: они показывают, где именно робот ломается — на переносе навыка, тактильном контакте, длинной задаче, безопасности или данных.' },
    method: { eyebrow: 'МЕТОД', copy: 'Прогресс по каждому барьеру — экспертная оценка AI Countdown, а не единый научный benchmark. Она отражает разрыв до массового, безопасного и экономически оправданного использования в жизни и работе. Источники показывают направление прогресса и ограничения, но не превращают демонстрацию в гарантию.' },
    methodology: 'Методология', home: 'AI Countdown',
    count: (shown, total) => `Показано ${shown} из ${total} барьеров`,
    progress: 'готово', current: 'сейчас', gap: 'остаётся', status: 'СТАТУС', sources: 'Материалы', next: 'Следующий практический тест'
  },
  en: {
    back: 'Back home',
    toolbar: 'ROBOTS · LIFE + WORK',
    eyebrow: 'ROBOTS · BARRIER MAP',
    title: 'What keeps us from putting a general-purpose robot next to a person',
    lede: 'AI can already see, explain, and plan. A robot must also touch the world safely, recover from mistakes, run for hours, and pay for itself. This is a map of the gaps between a demo and everyday reliability.',
    kpi: {
      overallLabel: 'AVERAGE READINESS', overallNote: 'editorial score across 10 barriers',
      countLabel: 'KEY BARRIERS', countNote: 'from physics to economics',
      closedLabel: 'FULLY SOLVED', closedNote: 'none on this open scale yet'
    },
    reading: { eyebrow: 'HOW TO READ THE SCALE', title: 'Not a date forecast. A map of bottlenecks.', copy: '100% does not mean a beautiful demo. It means robust operation across varied real conditions, including errors, edge cases, maintenance, and safety. The percentages are our explicit editorial scale, ready to be updated as evidence improves.' },
    resolved: { eyebrow: 'SOLVED IN A NARROW SCOPE', title: 'What can already be marked 100%', copy: 'Here 100% means a specific function is proven or standardized under stated conditions. It does not mean a general-purpose robot can do the same thing in every home, factory, or around every person.', boundary: 'Boundary', source: 'Source' },
    barriers: { eyebrow: 'THE BIG GAPS', title: 'What still needs to be proven' },
    filters: { all: 'All', life: 'Life', work: 'Work' },
    frontier: { eyebrow: 'WHERE WE ARE', title: 'The environment matters more than the robot’s shape', copy: 'The same robot can look nearly ready in a factory and helpless in a kitchen. The deciding variable is how much uncertainty, human traffic, and exception handling surround it.' },
    materials: { eyebrow: 'MATERIALS', title: 'Where to start checking', copy: 'Not a marketing leaderboard: a short set of primary materials covering lab results, safety standards, and statistics on robots actually deployed.' },
    research: { eyebrow: 'RESEARCH AND BENCHMARKS', title: 'How to test progress', copy: 'Use these works as a map of measurements: they show whether a robot fails on transfer, touch, long-horizon execution, safety, or data diversity.' },
    method: { eyebrow: 'METHOD', copy: 'Each barrier score is an AI Countdown expert estimate, not a single scientific benchmark. It represents the remaining gap to mass, safe, and economically sound use across life and work. The sources show direction and limitations; they do not turn a demo into a guarantee.' },
    methodology: 'Methodology', home: 'AI Countdown',
    count: (shown, total) => `Showing ${shown} of ${total} barriers`,
    progress: 'ready', current: 'now', gap: 'left', status: 'STATUS', sources: 'Materials', next: 'Next practical test'
  }
};

const BARRIERS = [
  {
    id: 'generality', index: '01', tone: 'violet', progress: 36, weight: 1.3, contexts: ['life', 'work'],
    ru: { group: 'МОЗГ', title: 'Обобщение между средами и корпусами', summary: 'Робот должен переносить навык на новую квартиру, предмет, человека и собственное тело — без ручной перенастройки.', evidence: 'RoboDojo уже разделяет проверку на обобщение, память, точность, длинные действия и open-vocabulary инструкции; это полезнее одной красивой демонстрации, но разрыв между симуляцией и реальным миром остаётся.', next: 'Проверка: один протокол на новых сценах и нескольких корпусах, с одинаковыми метриками переноса.' },
    en: { group: 'MIND', title: 'Generalization across worlds and bodies', summary: 'A robot must transfer a skill to a new home, object, person, and its own body without manual retuning.', evidence: 'RoboDojo evaluates generalization, memory, precision, long-horizon execution, and open-vocabulary instructions together; the sim-to-real gap still remains.', next: 'Test: one protocol across new scenes and multiple bodies, with the same transfer metrics.' },
    sources: [{ label: 'RoboDojo · 2026 benchmark', href: 'https://arxiv.org/abs/2607.04434' }, { label: 'Gemini Robotics', href: 'https://deepmind.google/blog/gemini-robotics-brings-ai-into-the-physical-world/' }]
  },
  {
    id: 'dexterity', index: '02', tone: 'cyan', progress: 32, weight: 1.2, contexts: ['life', 'work'],
    ru: { group: 'ТЕЛО', title: 'Деликатная моторика и тактильный контакт', summary: 'Взять мокрый пакет, распутать провод, застегнуть пуговицу и не раздавить хрупкое — разные режимы силы, трения и обратной связи.', evidence: 'TacO показывает, что польза тактильного сенсора зависит от материала, модальности и самой задачи. Универсальной «кожи» робота пока нет.', next: 'Проверка: смешанные контактные задачи с occlusion, неопределённой массой и меняющимся трением.' },
    en: { group: 'BODY', title: 'Dexterity and tactile contact', summary: 'Picking up a wet bag, untangling a cable, fastening a button, and not crushing a fragile object require different force, friction, and feedback.', evidence: 'TacO shows that tactile value depends on the material, sensor modality, and task. There is no universal robot skin yet.', next: 'Test: mixed contact-rich tasks with occlusion, unknown mass, and changing friction.' },
    sources: [{ label: 'TacO · tactile benchmark', href: 'https://arxiv.org/abs/2605.21976' }, { label: 'DexTouch', href: 'https://arxiv.org/abs/2401.12496' }]
  },
  {
    id: 'data', index: '03', tone: 'violet', progress: 43, weight: 1.1, contexts: ['life', 'work'],
    ru: { group: 'ОБУЧЕНИЕ', title: 'Данные, sim-to-real и sample efficiency', summary: 'Видео человека не равно траектории робота: нужны действия, силы, столкновения, неудачи и связь с конкретным телом.', evidence: 'DROID даёт 76 тыс. траекторий из 564 сцен, а Open X-Embodiment объединяет 22 робота и 527 навыков. Масштаб растёт, но сбор физического опыта всё ещё дорогой и неравномерный.', next: 'Проверка: новый навык после десятков демонстраций, с измерением переноса на незнакомое железо.' },
    en: { group: 'LEARNING', title: 'Data, sim-to-real, and sample efficiency', summary: 'A human video is not a robot trajectory: we need actions, forces, collisions, failures, and the body’s own state.', evidence: 'DROID provides 76k trajectories across 564 scenes, while Open X-Embodiment combines 22 robots and 527 skills. Scale is improving, but physical data is still expensive and uneven.', next: 'Test: learn a new skill from tens of demonstrations and measure transfer to unseen hardware.' },
    sources: [{ label: 'DROID', href: 'https://arxiv.org/abs/2403.12945' }, { label: 'Open X-Embodiment', href: 'https://arxiv.org/abs/2310.08864' }]
  },
  {
    id: 'planning', index: '04', tone: 'violet', progress: 27, weight: 1.4, contexts: ['life', 'work'],
    ru: { group: 'ПЛАН', title: 'Длинные задачи, память и неоднозначные инструкции', summary: 'Помыть кухню или подготовить заказ — это десятки зависимых шагов, где ошибка в начале меняет весь план.', evidence: 'В LongAct лучшие модели достигали 59% выполнения целей, но только 16% полного задания. В новом benchmark с неопределённостью лучший planner показал 45.3% success.', next: 'Проверка: оценивать полное задание, память, предикаты и восстановление, а не отдельные короткие действия.' },
    en: { group: 'PLANNING', title: 'Long tasks, memory, and ambiguity', summary: 'Cleaning a kitchen or preparing an order means dozens of dependent steps, where an early error changes the whole plan.', evidence: 'On LongAct, top models reached 59% goal completion but only 16% full-task success. A newer uncertainty benchmark reports 45.3% best overall task success.', next: 'Test: score full tasks, memory, preconditions, and recovery—not isolated short actions.' },
    sources: [{ label: 'LongAct · household benchmark', href: 'https://arxiv.org/abs/2605.14504' }, { label: 'Long-horizon under uncertainty', href: 'https://arxiv.org/abs/2610.17326' }]
  },
  {
    id: 'recovery', index: '05', tone: 'cyan', progress: 33, weight: 1.2, contexts: ['life', 'work'],
    ru: { group: 'СИСТЕМА', title: 'Обнаружение ошибки и восстановление', summary: 'Надёжность — это не только попасть в цель, но и понять, что что-то пошло не так, остановиться и вернуть задачу человеку.', evidence: 'Runtime-monitoring подходы уже учатся предсказывать риск до неизбежного сбоя и снижать нагрузку на оператора. Но для массового робота нужны стандартизированные failure taxonomies и логи длинных развертываний.', next: 'Проверка: время до обнаружения, безопасная остановка, эскалация и восстановление после каждого сбоя.' },
    en: { group: 'SYSTEM', title: 'Error detection and recovery', summary: 'Reliability is not only reaching a goal; it is noticing a failure, stopping safely, and handing the task back to a person.', evidence: 'Runtime-monitoring methods can predict risk before failure becomes unavoidable and reduce operator workload. Mass deployment still needs shared failure taxonomies and long-run logs.', next: 'Test: detection time, safe stop, escalation, and recovery after every failure.' },
    sources: [{ label: 'Runtime Monitoring', href: 'https://arxiv.org/abs/2310.17552' }, { label: 'IFR · 2026 trends', href: 'https://ifr.org/ifr-press-releases/top-5-global-robotics-trends-2026' }]
  },
  {
    id: 'safety', index: '06', tone: 'lime', progress: 44, weight: 1.4, contexts: ['life', 'work'],
    ru: { group: 'БЕЗОПАСНОСТЬ', title: 'Безопасность рядом с людьми', summary: 'Робот должен не только избегать столкновения, но и понимать риск для ребёнка, пожилого человека, животного и имущества.', evidence: 'Для cobot уже есть измеримые режимы силы и дистанции. ASIMOV-Agentic добавляет отказ от опасных действий, protective stop, out-of-distribution и запрос помощи; для дома и ухода этого пока мало.', next: 'Проверка: независимый safety-case для редких, но тяжёлых сценариев до массового запуска.' },
    en: { group: 'SAFETY', title: 'Safety around people', summary: 'A robot must not only avoid collisions; it must understand risk to a child, older adult, animal, and property.', evidence: 'Cobots have measurable force and separation modes. ASIMOV-Agentic adds unsafe-task refusal, protective stops, OOD shielding, and help requests; homes and care settings still need more.', next: 'Test: an independent safety case for rare but severe scenarios before mass deployment.' },
    sources: [{ label: 'ASIMOV-Agentic', href: 'https://deepmind.google/research/evals/?hl=ca' }, { label: 'NIST · robot safety', href: 'https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=924262' }]
  },
  {
    id: 'power', index: '07', tone: 'lime', progress: 54, weight: 0.8, contexts: ['life', 'work'],
    ru: { group: 'ЭНЕРГИЯ', title: 'Батарея, тепло, полезная нагрузка', summary: 'Полезный робот должен долго двигаться, считать и удерживать груз — без слишком тяжёлой батареи и перегрева.', evidence: 'Обзор 2026 года описывает конфликт между энергоёмкостью, массой, безопасностью, теплом и геометрией корпуса. On-device модели помогают, но не отменяют физическую цену движения.', next: 'Проверка: полный рабочий день с реальной нагрузкой и предсказуемым снижением производительности при разряде.' },
    en: { group: 'ENERGY', title: 'Battery, heat, and payload', summary: 'A useful robot must move, compute, and carry for long periods without an oversized battery or overheating.', evidence: 'A 2026 review highlights the trade-off between energy, mass, safety, heat, and the constrained humanoid chassis. On-device models help, but motion still has a physical cost.', next: 'Test: a full working day at useful load with predictable degradation as energy falls.' },
    sources: [{ label: 'Battery technology review · 2026', href: 'https://advanced.onlinelibrary.wiley.com/doi/10.1002/advs.76736' }, { label: 'On-Device Robotics', href: 'https://deepmind.google/blog/gemini-robotics-on-device-brings-ai-to-local-robotic-devices/' }]
  },
  {
    id: 'hardware', index: '08', tone: 'cyan', progress: 35, weight: 1.2, contexts: ['life', 'work'],
    ru: { group: 'ЖЕЛЕЗО', title: 'Износ, uptime и обслуживание', summary: 'Робот должен не только работать, но и выдерживать тысячи циклов, быстро диагностироваться и ремонтироваться без долгого простоя.', evidence: 'IFR прямо выделяет cycle time, energy consumption и maintenance costs как требования к гуманоидным системам. В промышленном опросе PMMI 69% пользователей назвали reliability и uptime очень важными при выборе поставщика.', next: 'Проверка: часы полезной работы на час обслуживания, доступность запчастей и повторяемость после ремонта.' },
    en: { group: 'HARDWARE', title: 'Wear, uptime, and serviceability', summary: 'A robot must survive thousands of cycles, diagnose itself, and be repaired without long downtime.', evidence: 'IFR highlights cycle time, energy consumption, and maintenance costs as requirements for humanoids. In a 2026 PMMI survey, 69% of end users called reliability and uptime very important when choosing an OEM.', next: 'Test: useful operating hours per service hour, spare-parts access, and repeatability after repair.' },
    sources: [{ label: 'IFR · 2026 trends', href: 'https://ifr.org/ifr-press-releases/top-5-global-robotics-trends-2026' }, { label: 'PMMI · Robotics 2026', href: 'https://www.pmmi.org/report/2026-robotics-in-packaging-and-processing' }]
  },
  {
    id: 'economics', index: '09', tone: 'violet', progress: 41, weight: 1.1, contexts: ['work'],
    ru: { group: 'МАСШТАБ', title: 'Цена, производительность и окупаемость', summary: 'Даже работающий робот должен быть выгоднее человека или узкого автомата с учётом простоя, обучения, интеграции и страховки.', evidence: 'Промышленные роботы масштабируются в повторяемых средах, но гуманоид должен конкурировать не с нулём, а с отлаженным процессом и понятным throughput. Бизнес-кейс остаётся отдельной проблемой.', next: 'Проверка: total cost of ownership, throughput и стоимость исключений на одной операции за несколько месяцев.' },
    en: { group: 'SCALE', title: 'Cost, throughput, and payback', summary: 'Even a working robot must beat a person or narrow automation after downtime, training, integration, and insurance.', evidence: 'Industrial robots scale in repeatable environments, but a humanoid competes with an optimized process and known throughput. The business case is still a separate bottleneck.', next: 'Test: total cost of ownership, throughput, and exception cost on one operation over several months.' },
    sources: [{ label: 'IFR · World Robotics 2026', href: 'https://ifr.org/ifr-press-releases/news/five-million-robots-now-operate-in-factories-globally' }, { label: 'Stanford AI Index 2026', href: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_4_economy.pdf' }]
  },
  {
    id: 'deployment', index: '10', tone: 'cyan', progress: 48, weight: 1.3, contexts: ['life', 'work'],
    ru: { group: 'СРЕДА', title: 'Интеграция IT/OT, стандарты и ответственность', summary: 'Кто отвечает за ошибку? Где хранятся видео и сенсорные данные? Как робот встраивается в расписания, ERP, двери, профсоюзы и местные правила?', evidence: 'IFR в 2026 отдельно выделяет слияние IT и OT, cybersecurity, стандарты и liability. Модель может быть умной, но без операционного контура она не становится работником.', next: 'Проверка: аудит решений, кибербезопасность, право на остановку и понятный владелец риска в каждом сценарии.' },
    en: { group: 'CONTEXT', title: 'IT/OT integration, standards, and liability', summary: 'Who is liable for a mistake? Where do video and sensor data go? How does the robot fit schedules, ERP, doors, unions, and local rules?', evidence: 'IFR identifies IT/OT convergence, cybersecurity, standards, and liability as 2026 priorities. A smart model is not a worker until it fits the operational stack.', next: 'Test: decision audit, cybersecurity, stop rights, and a clear owner of risk for every scenario.' },
    sources: [{ label: 'IFR · 2026 trends', href: 'https://ifr.org/ifr-press-releases/top-5-global-robotics-trends-2026' }, { label: 'IFR · AI in Robotics', href: 'https://ifr.org/ifr-press-releases/news/ai-in-robotics-new-position-paper' }]
  }
];

const RESOLVED = [
  {
    tone: 'lime',
    date: { ru: '2026-09-24 · данные за 2025', en: '2026-09-24 · 2025 data' },
    title: { ru: 'Повторяемый цикл в производственной ячейке', en: 'A repeatable cycle in a production cell' },
    achieved: { ru: '100% в узком сценарии: известные детали, фиксированная геометрия, повторяемый маршрут и заранее спроектированная ячейка.', en: '100% in a narrow scenario: known parts, fixed geometry, repeatable motion, and a pre-engineered cell.' },
    boundary: { ru: 'Новые предметы, исключения и соседство с людьми снова открывают барьер.', en: 'Novel objects, exceptions, and human proximity reopen the barrier.' },
    source: { ru: 'IFR · World Robotics 2026', en: 'IFR · World Robotics 2026' },
    href: 'https://ifr.org/ifr-press-releases/news/five-million-robots-now-operate-in-factories-globally'
  },
  {
    tone: 'cyan',
    date: { ru: '2016-08-01', en: '2016-08-01' },
    title: { ru: 'Базовые режимы безопасности cobot', en: 'Core cobot safety modes' },
    achieved: { ru: '100% как инженерные примитивы: monitored stop, speed-and-separation monitoring, hand-guiding и power-and-force limiting описаны в стандартизованной рамке.', en: '100% as engineering primitives: monitored stop, speed-and-separation monitoring, hand-guiding, and power-and-force limiting are defined in a standardized framework.' },
    boundary: { ru: 'Стандартный режим не сертифицирует весь сценарий и не решает бытовую безопасность.', en: 'A standard mode does not certify the whole application or solve home safety.' },
    source: { ru: 'NIST · ISO/TS 15066', en: 'NIST · ISO/TS 15066' },
    href: 'https://www.nist.gov/publications/implementing-speed-and-separation-monitoring-collaborative-robot-workcells'
  },
  {
    tone: 'violet',
    date: { ru: '2025-11-19', en: '2025-11-19' },
    title: { ru: 'Автономный транспорт внутри структурированной фабрики', en: 'Autonomous transport inside a structured factory' },
    achieved: { ru: '100% для описанного кейса: AMR-флот перевозит материалы между зонами без постоянного управления человеком и интегрируется с производственным процессом.', en: '100% for the described case: an AMR fleet moves materials between zones without continuous human control and integrates with production.' },
    boundary: { ru: 'Открытая улица, незнакомый дом или свободная манипуляция — это уже другая задача.', en: 'Open streets, unfamiliar homes, and free-form manipulation are different problems.' },
    source: { ru: 'IFR · OTTO AMR, 2025', en: 'IFR · OTTO AMR, 2025' },
    href: 'https://ifr.org/ifr-press-releases/news/pioneering-robot-otto-wins-the-2025-iera-award'
  },
  {
    tone: 'cyan',
    date: { ru: '2025-06-24', en: '2025-06-24' },
    title: { ru: 'Локальный inference на самом роботе', en: 'On-device inference on the robot' },
    achieved: { ru: '100% для конкретного локального контура: модель может работать непосредственно на роботе, без обязательного облачного round-trip на каждом действии.', en: '100% for a specific local loop: the model can run directly on the robot without a required cloud round-trip for every action.' },
    boundary: { ru: 'Локальный inference ещё не означает долгую, безопасную и универсальную автономность.', en: 'Local inference does not imply long-running, safe, or general autonomy.' },
    source: { ru: 'Google DeepMind · On-Device Robotics', en: 'Google DeepMind · On-Device Robotics' },
    href: 'https://deepmind.google/blog/gemini-robotics-on-device-brings-ai-to-local-robotic-devices/'
  }
];

const FRONTIER = [
  { tone: 'violet', progress: 84, ru: { title: 'Экран и офис', note: 'Структурированные цифровые среды: много данных, мало физического риска.' }, en: { title: 'Screens and offices', note: 'Structured digital environments: lots of data, little physical risk.' } },
  { tone: 'cyan', progress: 72, ru: { title: 'Цех и склад', note: 'Повторяемые маршруты, ограждения, инструменты и заранее известные объекты.' }, en: { title: 'Factories and warehouses', note: 'Repeatable routes, guards, tools, and known objects.' } },
  { tone: 'lime', progress: 41, ru: { title: 'Магазин и сервис', note: 'Больше людей, разговоров, исключений и меняющейся обстановки.' }, en: { title: 'Retail and service', note: 'More people, conversation, exceptions, and changing surroundings.' } },
  { tone: 'violet', progress: 24, ru: { title: 'Дом', note: 'Каждая квартира — отдельный мир; предметы лежат не там, где их ждали.' }, en: { title: 'Home', note: 'Every home is a different world; objects are never where expected.' } },
  { tone: 'cyan', progress: 16, ru: { title: 'Уход и дети', note: 'Самая высокая цена ошибки, самая низкая терпимость к непредсказуемости.' }, en: { title: 'Care and children', note: 'The highest cost of failure and the lowest tolerance for unpredictability.' } }
];

const MATERIALS = [
  { tone: 'violet', type: { ru: 'ЛАБОРАТОРИЯ', en: 'LAB' }, title: { ru: 'Gemini Robotics', en: 'Gemini Robotics' }, note: { ru: 'Обобщение, интерактивность, моторика и перенос между корпусами.', en: 'Generality, interactivity, dexterity, and cross-embodiment transfer.' }, href: 'https://deepmind.google/blog/gemini-robotics-brings-ai-into-the-physical-world/' },
  { tone: 'cyan', type: { ru: 'СТАНДАРТ', en: 'STANDARD' }, title: { ru: 'NIST / collaborative robots', en: 'NIST / collaborative robots' }, note: { ru: 'Измерение силы, дистанции и безопасного взаимодействия с человеком.', en: 'Measuring force, separation, and safe human-robot interaction.' }, href: 'https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=924262' },
  { tone: 'lime', type: { ru: 'РЫНОК', en: 'MARKET' }, title: { ru: 'World Robotics', en: 'World Robotics' }, note: { ru: 'Что уже реально устанавливают в промышленности и сервисе.', en: 'What is actually being installed in industry and services.' }, href: 'https://ifr.org/ifr-press-releases/news/five-million-robots-now-operate-in-factories-globally' },
  { tone: 'violet', type: { ru: 'ИССЛЕДОВАНИЕ', en: 'RESEARCH' }, title: { ru: 'DemoHLM', en: 'DemoHLM' }, note: { ru: 'Одна демонстрация и обобщаемая loco-manipulation для гуманоидов.', en: 'One demonstration and generalizable loco-manipulation for humanoids.' }, href: 'https://arxiv.org/abs/2510.11258' }
];

const RESEARCH = [
  { tone: 'violet', tag: { ru: 'ОБОБЩЕНИЕ', en: 'GENERALIZATION' }, title: { ru: 'RT-2', en: 'RT-2' }, note: { ru: 'Как web-знания и траектории робота помогают переносить инструкции на новые объекты.', en: 'How web knowledge and robot trajectories help transfer instructions to new objects.' }, href: 'https://arxiv.org/abs/2307.15818' },
  { tone: 'cyan', tag: { ru: 'ДАННЫЕ / КОРПУСА', en: 'DATA / EMBODIMENTS' }, title: { ru: 'Open X-Embodiment / RT-X', en: 'Open X-Embodiment / RT-X' }, note: { ru: 'Общий датасет и политика для разных роботов, навыков и задач.', en: 'A shared dataset and policy across robots, skills, and tasks.' }, href: 'https://arxiv.org/abs/2310.08864' },
  { tone: 'lime', tag: { ru: 'ДАННЫЕ В СРЕДЕ', en: 'IN-THE-WILD DATA' }, title: { ru: 'DROID', en: 'DROID' }, note: { ru: 'Большой корпус демонстраций из разных сцен и задач, собранных вне лаборатории.', en: 'A large manipulation dataset collected across diverse scenes and tasks outside a single lab.' }, href: 'https://arxiv.org/abs/2403.12945' },
  { tone: 'violet', tag: { ru: 'ТАКТИЛЬНОСТЬ', en: 'TACTILE SENSING' }, title: { ru: 'TacO', en: 'TacO' }, note: { ru: 'Сравнение тактильных сенсоров на контактоёмких задачах: масса, поворот и вставка.', en: 'A task-driven comparison of tactile sensors for mass, reorientation, and insertion tasks.' }, href: 'https://arxiv.org/abs/2605.21976' },
  { tone: 'cyan', tag: { ru: 'БЕЗОПАСНОСТЬ', en: 'SAFETY' }, title: { ru: 'ASIMOV-Agentic', en: 'ASIMOV-Agentic' }, note: { ru: 'Benchmark отказа от опасной команды, защитной остановки и запроса помощи при неопределённости.', en: 'A benchmark for refusing unsafe tasks, triggering protective stops, and asking for help under uncertainty.' }, href: 'https://deepmind.google/research/evals/?hl=ca' },
  { tone: 'lime', tag: { ru: 'НАДЁЖНОСТЬ', en: 'RELIABILITY' }, title: { ru: 'Runtime Monitoring', en: 'Runtime Monitoring' }, note: { ru: 'Мониторинг ошибок во время работы и прогнозирование будущего сбоя до того, как он станет неизбежным.', en: 'Runtime error monitoring and preemptive failure prediction before a failure becomes unavoidable.' }, href: 'https://arxiv.org/abs/2310.17552' },
  { tone: 'violet', tag: { ru: 'ДЛИННАЯ ЗАДАЧА', en: 'LONG HORIZON' }, title: { ru: 'LongAct', en: 'LongAct' }, note: { ru: 'Свободные бытовые инструкции, память, зависимости шагов и адаптивное планирование.', en: 'Free-form household instructions, memory, step dependencies, and adaptive planning.' }, href: 'https://arxiv.org/abs/2605.14504' },
  { tone: 'cyan', tag: { ru: 'СЕНСОРИКА', en: 'TOUCH + VISION' }, title: { ru: 'DexTouch', en: 'DexTouch' }, note: { ru: 'Как тактильное восприятие помогает искать и манипулировать объектами без зрения.', en: 'How tactile perception helps robots search for and manipulate objects without vision.' }, href: 'https://arxiv.org/abs/2401.12496' },
  { tone: 'violet', tag: { ru: 'СИМ + REAL', en: 'SIM + REAL' }, title: { ru: 'RoboDojo', en: 'RoboDojo' }, note: { ru: 'Единый benchmark для generalist-политик: 42 симуляционные и 18 реальных задач.', en: 'A unified benchmark for generalist policies: 42 simulation and 18 real-world tasks.' }, href: 'https://arxiv.org/abs/2607.04434' },
  { tone: 'lime', tag: { ru: 'ЭНЕРГИЯ', en: 'ENERGY' }, title: { ru: 'Battery technology review', en: 'Battery technology review' }, note: { ru: 'Компромисс между массой батареи, теплом, безопасностью и временем работы гуманоидов.', en: 'Trade-offs between battery mass, heat, safety, and humanoid operating time.' }, href: 'https://advanced.onlinelibrary.wiley.com/doi/10.1002/advs.76736' },
  { tone: 'cyan', tag: { ru: 'UPTIME', en: 'UPTIME' }, title: { ru: 'PMMI Robotics 2026', en: 'PMMI Robotics 2026' }, note: { ru: 'Интеграция, сервис, запчасти и надёжность глазами пользователей роботизированных линий.', en: 'Integration, service, spare parts, and reliability from robotics end users.' }, href: 'https://www.pmmi.org/report/2026-robotics-in-packaging-and-processing' },
  { tone: 'violet', tag: { ru: 'РЫНОК', en: 'MARKET' }, title: { ru: 'IFR Trends 2026', en: 'IFR Trends 2026' }, note: { ru: 'Актуальная рамка: автономность, IT/OT, гуманоиды, безопасность и дефицит труда.', en: 'The current frame: autonomy, IT/OT, humanoids, safety, and labor gaps.' }, href: 'https://ifr.org/ifr-press-releases/top-5-global-robotics-trends-2026' }
];

let locale = 'ru';
let filter = 'all';

function copy(key) {
  return key.split('.').reduce((value, part) => value?.[part], BARRIERS_COPY[locale]) ?? key;
}

function applyLocale(nextLocale) {
  locale = BARRIERS_COPY[nextLocale] ? nextLocale : 'ru';
  document.documentElement.lang = locale;
  document.title = locale === 'ru' ? 'AI Countdown — что мешает роботам жить и работать рядом с нами' : 'AI Countdown — what keeps robots from living and working beside us';
  document.querySelector('meta[name="description"]')?.setAttribute('content', locale === 'ru'
    ? 'Карта главных барьеров для универсальных роботов: жизнь, работа, материалы, прогресс и редакционные оценки того, насколько каждая проблема уже решена.'
    : 'A map of the main barriers to general-purpose robots across life and work, with materials and editorial progress scores.');
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = copy(element.dataset.i18n); });
  document.querySelectorAll('[data-locale]').forEach((button) => {
    const active = button.dataset.locale === locale;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderBarriers();
  renderFrontier();
  renderMaterials();
  renderResearch();
  renderResolved();
  try { localStorage.setItem('ai-countdown-barriers-locale', locale); } catch (error) { /* storage is optional */ }
}

function progressBar(value, tone, label) {
  return `<div class="barrier-progress" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}" style="--barrier-progress:${value}%;--barrier-color:var(--${tone})"><i></i></div>`;
}

function renderBarriers() {
  const visible = BARRIERS.filter((barrier) => filter === 'all' || barrier.contexts.includes(filter));
  document.querySelector('#barriers-count').textContent = copy('count')(visible.length, BARRIERS.length);
  document.querySelector('#barriers-list').innerHTML = visible.map((barrier) => {
    const item = barrier[locale];
    const contextLabel = barrier.contexts.length > 1 ? (locale === 'ru' ? 'ЖИЗНЬ + РАБОТА' : 'LIFE + WORK') : (barrier.contexts[0] === 'life' ? copy('filters.life').toUpperCase() : copy('filters.work').toUpperCase());
    return `<article class="barrier-card" data-tone="${barrier.tone}" style="--barrier-color:var(--${barrier.tone})">
      <div class="barrier-card-top"><span class="barrier-index">${barrier.index}</span><span class="barrier-group">${item.group}</span><span class="barrier-context">${contextLabel}</span></div>
      <div class="barrier-card-grid">
        <div class="barrier-copy"><h3>${item.title}</h3><p class="barrier-summary">${item.summary}</p><p class="barrier-evidence"><span>${copy('current')}</span> ${item.evidence}</p><p class="barrier-next"><span>${copy('next')}</span> ${item.next}</p></div>
        <div class="barrier-score"><strong>${barrier.progress}%</strong><span>${copy('progress')}</span>${progressBar(barrier.progress, barrier.tone, `${item.title}: ${barrier.progress}%`)}<small>${copy('gap')}: ${100 - barrier.progress}%</small></div>
      </div>
      <div class="barrier-card-bottom"><span>${copy('status')}: ${barrier.progress >= 70 ? (locale === 'ru' ? 'ПЕРЕД ВНЕДРЕНИЕМ' : 'DEPLOYMENT') : barrier.progress >= 40 ? (locale === 'ru' ? 'ПРОТОТИПЫ' : 'PROTOTYPES') : (locale === 'ru' ? 'ИССЛЕДОВАНИЯ' : 'RESEARCH')}</span><span>${copy('sources')}: ${barrier.sources.map((source) => `<a href="${source.href}" target="_blank" rel="noreferrer">${source.label}</a>`).join(' · ')}</span></div>
    </article>`;
  }).join('');
}

function renderFrontier() {
  document.querySelector('#frontier-grid').innerHTML = FRONTIER.map((area) => {
    const item = area[locale];
    return `<article class="frontier-card" data-tone="${area.tone}" style="--barrier-color:var(--${area.tone})"><div class="frontier-top"><span>${item.title}</span><strong>${area.progress}%</strong></div>${progressBar(area.progress, area.tone, `${item.title}: ${area.progress}%`)}<p>${item.note}</p></article>`;
  }).join('');
}

function renderMaterials() {
  document.querySelector('#materials-grid').innerHTML = MATERIALS.map((material) => {
    const type = material.type[locale];
    const title = material.title[locale];
    return `<a class="material-card" data-tone="${material.tone}" style="--barrier-color:var(--${material.tone})" href="${material.href}" target="_blank" rel="noreferrer"><span class="material-type">${type}</span><b>${title}</b><p>${material.note[locale]}</p><small>${new URL(material.href).hostname.replace(/^www\./, '')}</small></a>`;
  }).join('');
}

function renderResearch() {
  document.querySelector('#research-grid').innerHTML = RESEARCH.map((item) => `<a class="research-card" data-tone="${item.tone}" style="--barrier-color:var(--${item.tone})" href="${item.href}" target="_blank" rel="noreferrer"><span class="research-tag">${item.tag[locale]}</span><b>${item.title[locale]}</b><p>${item.note[locale]}</p><small>${new URL(item.href).hostname.replace(/^www\./, '')}</small></a>`).join('');
}

function renderResolved() {
  document.querySelector('#resolved-grid').innerHTML = RESOLVED.map((item) => `<article class="resolved-card" data-tone="${item.tone}" style="--barrier-color:var(--${item.tone})"><div class="resolved-card-top"><span class="resolved-badge">100%</span><time datetime="${item.date[locale].slice(0, 10)}">${item.date[locale]}</time></div><h3>${item.title[locale]}</h3><p class="resolved-achieved">${item.achieved[locale]}</p><p class="resolved-boundary"><span>${copy('resolved.boundary')}:</span> ${item.boundary[locale]}</p><a class="resolved-source" href="${item.href}" target="_blank" rel="noreferrer">${copy('resolved.source')} · ${item.source[locale]}</a></article>`).join('');
}

function renderKpis() {
  const totalWeight = BARRIERS.reduce((sum, barrier) => sum + barrier.weight, 0);
  const average = Math.round(BARRIERS.reduce((sum, barrier) => sum + barrier.progress * barrier.weight, 0) / totalWeight);
  document.querySelector('#overall-progress').textContent = `${average}%`;
  document.querySelector('#barrier-count').textContent = BARRIERS.length;
  document.querySelector('#closed-count').textContent = BARRIERS.filter((barrier) => barrier.progress >= 80).length;
}

document.querySelectorAll('[data-locale]').forEach((button) => button.addEventListener('click', () => applyLocale(button.dataset.locale)));
document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('active', item === button));
  renderBarriers();
}));

let savedLocale = 'ru';
try { savedLocale = localStorage.getItem('ai-countdown-barriers-locale') || 'ru'; } catch (error) { /* storage is optional */ }
renderKpis();
applyLocale(savedLocale);
