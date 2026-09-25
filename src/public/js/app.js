document.querySelectorAll('[aria-disabled="true"]').forEach((link) => {
  link.addEventListener('click', (event) => event.preventDefault());
});

const themeToggle = document.querySelector('[data-theme-toggle]');
const themeLabel = document.querySelector('[data-theme-label]');

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem('theme', theme);
  } catch (error) {
    // Preferencia visual continua funcionando na sessao atual.
  }

  if (themeToggle && themeLabel) {
    const isDark = theme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeLabel.textContent = isDark ? 'Escuro' : 'Claro';
  }
}

if (themeToggle) {
  setTheme(document.documentElement.dataset.theme || 'light');

  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });
}
