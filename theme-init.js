(() => {
  const theme = localStorage.getItem('theme') || 'system';
  document.documentElement.setAttribute(
    'data-theme-active',
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light'
  );
})();
