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

const todayKey = () => {
  const date = new Date();

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

const updateMessage = count => {
  const message = document.getElementById('message');
  message.textContent = `You've opened ${count === 1 ? 'your first new tab' : `${count} new tabs`} today`;
};

const incrementCount = () => {
  const key = todayKey();

  chrome.storage.local.get(['countDate', 'count'], ({ countDate, count = 0 }) => {
    const newCount = countDate === key ? count + 1 : 1;

    chrome.storage.local.set({ countDate: key, count: newCount });

    document.getElementById('count').textContent = newCount;
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
