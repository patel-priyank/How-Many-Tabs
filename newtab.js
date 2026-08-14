// #region theme handling

const applyTheme = theme => {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme-active', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme-active', theme);
  }

  document.querySelectorAll('.theme-selector button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
};

const setTheme = theme => {
  chrome.storage.local.set({ theme });
  localStorage.setItem('theme', theme);
  applyTheme(theme);
};

const initTheme = () => {
  chrome.storage.local.get(['theme'], ({ theme = 'system' }) => {
    applyTheme(theme);
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    chrome.storage.local.get(['theme'], ({ theme = 'system' }) => {
      if (theme === 'system') {
        applyTheme('system');
      }
    });
  });

  document.querySelectorAll('.theme-selector button').forEach(btn => {
    btn.addEventListener('click', () => setTheme(btn.dataset.theme));
  });
};

// #endregion

// #region count handling

const MESSAGE_TIERS = [
  {
    max: 1,
    messages: [
      () => `You've opened your first new tab today`,
      () => `First tab of the day`,
      () => `And so it begins, 1 tab today`
    ]
  },
  {
    max: 5,
    messages: [
      count => `You've opened ${count} new tabs today`,
      count => `${count} new tabs so far today`,
      count => `${count} tabs opened today`,
      count => `Just getting started, ${count} tabs today`
    ]
  },
  {
    max: 10,
    messages: [
      count => `${count} tabs, within reach of both hands full of fingers`,
      count => `${count} tabs and counting`,
      count => `${count} new tabs today`,
      count => `${count} tabs opened, nothing unusual yet`,
      count => `${count} tabs so far, steady pace`
    ]
  },
  {
    max: 26,
    messages: [
      count => `${count} tabs, some way into the alphabet`,
      count => `${count} tabs, less than a full alphabet's worth`,
      count => `${count} new tabs today`,
      count => `${count} tabs opened, picking up speed`,
      count => `${count} tabs today, more than a handful`
    ]
  },
  {
    max: 52,
    messages: [
      count => `${count} tabs, under a full deck of cards`,
      count => `${count} tabs, working through a deck of cards`,
      count => `${count} new tabs today`,
      count => `${count} tabs opened, a proper habit forming`,
      count => `${count} tabs today, well past the alphabet now`
    ]
  },
  {
    max: 88,
    messages: [
      count => `${count} tabs, under a piano's worth of keys`,
      count => `${count} tabs, closing in on a full piano`,
      count => `${count} new tabs today`,
      count => `${count} tabs opened, that's a lot of browsing`,
      count => `${count} tabs today, more than a full deck of cards`
    ]
  },
  {
    max: 118,
    messages: [
      count => `${count} tabs, approaching the periodic table`,
      count => `${count} tabs, most of the periodic table`,
      count => `${count} new tabs today`,
      count => `${count} tabs opened, an impressive tally`,
      count => `${count} tabs today, more than a piano has keys`
    ]
  },
  {
    max: Infinity,
    messages: [
      count => `${count} tabs, deep into triple digits`,
      count => `${count} new tabs today`,
      count => `${count} tabs opened, more than the periodic table has elements`,
      count => `${count} tabs today, at this point it's a lifestyle`,
      count => `${count} tabs, a genuinely staggering number`
    ]
  }
];

const todayKey = () => {
  const date = new Date();

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

const updateMessage = count => {
  const tier = MESSAGE_TIERS.find(tier => count <= tier.max);
  const variants = tier.messages;
  const pick = variants[Math.floor(Math.random() * variants.length)];

  document.getElementById('message').textContent = pick(count);
};

const animateCount = (target, duration = 1000) => {
  const start = performance.now();

  const step = now => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 5);
    const value = Math.round(eased * target);

    document.getElementById('count').textContent = value;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

const incrementCount = () => {
  const key = todayKey();

  chrome.storage.local.get(['countDate', 'count', 'history'], ({ countDate, count = 0, history = {} }) => {
    const isNewDay = countDate !== key;
    const newCount = isNewDay ? 1 : count + 1;

    const updatedHistory = isNewDay && countDate ? { ...history, [countDate]: count } : history;

    chrome.storage.local.set({ countDate: key, count: newCount, history: updatedHistory });

    animateCount(newCount);
    updateMessage(newCount);
  });
};

// #endregion

// #region stats modal

const openStatsModal = async () => {
  console.log(await getStats());
  renderCards(await getStats());
  document.getElementById('stats-modal').showModal();
};

const closeStatsModal = () => {
  document.getElementById('stats-modal').close();
};

const initStatsModal = () => {
  document.getElementById('stats-trigger').addEventListener('click', openStatsModal);
  document.getElementById('stats-close').addEventListener('click', closeStatsModal);
};

// #endregion

// #region stats data

const getDateKey = date => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

const getLast30Days = history => {
  const days = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const key = getDateKey(date);

    days.push({ date: key, count: history[key] ?? 0, weekday: date.getDay() });
  }

  return days;
};

const computeMovingAverage = (days, window = 7) => {
  return days.map((day, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = days.slice(start, i + 1);
    const avg = slice.reduce((sum, d) => sum + d.count, 0) / slice.length;

    return { date: day.date, average: avg };
  });
};

const computeWeekdayAverages = days => {
  const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return WEEKDAY_LABELS.map((label, weekday) => {
    const matching = days.filter(d => d.weekday === weekday);
    const total = matching.reduce((sum, d) => sum + d.count, 0);
    const average = matching.length ? total / matching.length : 0;

    return { label, average };
  });
};

const daysBetween = (start, end) => Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

const getAllTimeStats = (history, todayCount, todayDateKey) => {
  const merged = { ...history };

  if (todayCount > 0) {
    merged[todayDateKey] = todayCount;
  }

  const dates = Object.keys(merged).sort();

  if (dates.length === 0) {
    return { total: 0, average: 0, busiest: { date: todayDateKey, count: 0 }, streak: 0 };
  }

  const firstDate = new Date(dates[0]);
  const today = new Date(todayDateKey);
  const totalDays = daysBetween(firstDate, today);

  const total = Object.values(merged).reduce((sum, count) => sum + count, 0);
  const average = total / totalDays;

  const busiestDate = dates.reduce((best, date) => (merged[date] > merged[best] ? date : best), dates[0]);
  const busiest = { date: busiestDate, count: merged[busiestDate] };

  let streak = 0;

  const cursor = new Date(today);

  while (true) {
    const key = getDateKey(cursor);
    const count = merged[key] ?? 0;

    if (count === 0) {
      break;
    }

    streak++;

    cursor.setDate(cursor.getDate() - 1);
  }

  return { total, average, busiest, streak };
};

const getStats = () => {
  return new Promise(resolve => {
    chrome.storage.local.get(['history', 'count', 'countDate'], ({ history = {}, count = 0, countDate }) => {
      const days = getLast30Days(history);
      const today = days[days.length - 1];

      if (countDate === today.date) {
        today.count = count;
      }

      const allTime = getAllTimeStats(history, countDate === today.date ? count : 0, today.date);
      const movingAverage = computeMovingAverage(days);
      const weekdayAverages = computeWeekdayAverages(days);

      resolve({ days, movingAverage, weekdayAverages, ...allTime });
    });
  });
};

// #endregion

// #region stats render

const formatCount = n => Math.round(n).toLocaleString();

const renderCards = stats => {
  const cards = [
    { label: 'Total', value: formatCount(stats.total) },
    { label: 'Average / day', value: formatCount(stats.average) },
    { label: 'Busiest day', value: formatCount(stats.busiest.count) },
    { label: 'Streak', value: `${stats.streak}d` }
  ];

  document.getElementById('stats-cards').innerHTML = cards
    .map(
      card => `
        <div class="stats-card">
          <div class="stats-card-value">${card.value}</div>
          <div class="stats-card-label">${card.label}</div>
        </div>
      `
    )
    .join('');
};

// #endregion

// #region icons

const initIcons = () => {
  document.getElementById('stats-trigger').innerHTML = ICONS.chart;
  document.getElementById('stats-close').innerHTML = ICONS.close;
  document.querySelector('[data-theme="light"]').innerHTML = ICONS.sun;
  document.querySelector('[data-theme="dark"]').innerHTML = ICONS.moon;
  document.querySelector('[data-theme="system"]').innerHTML = ICONS.monitor;
};

// #endregion

// #region init

initIcons();
initTheme();
initStatsModal();
incrementCount();

// #endregion
