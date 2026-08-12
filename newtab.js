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

  chrome.storage.local.get(['countDate', 'count'], ({ countDate, count = 0 }) => {
    const newCount = countDate === key ? count + 1 : 1;

    chrome.storage.local.set({ countDate: key, count: newCount });

    animateCount(newCount);
    updateMessage(newCount);
  });
};

// #endregion

// #region icons

const initIcons = () => {
  document.querySelector('[data-theme="light"]').innerHTML = ICONS.sun;
  document.querySelector('[data-theme="dark"]').innerHTML = ICONS.moon;
  document.querySelector('[data-theme="system"]').innerHTML = ICONS.monitor;
};

// #endregion

// #region init

initIcons();
initTheme();
incrementCount();

// #endregion
