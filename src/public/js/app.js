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

const appShell = document.querySelector('.app-shell');
const sidebarToggle = document.querySelector('[data-sidebar-toggle]');

function setSidebarCollapsed(collapsed) {
  if (!appShell || !sidebarToggle) {
    return;
  }

  appShell.classList.toggle('sidebar-collapsed', collapsed);
  sidebarToggle.setAttribute('aria-pressed', String(collapsed));
  sidebarToggle.setAttribute('aria-label', collapsed ? 'Expandir menu lateral' : 'Recuar menu lateral');

  try {
    localStorage.setItem('sidebarCollapsed', collapsed ? 'true' : 'false');
  } catch (error) {
    // Preferencia visual continua funcionando na sessao atual.
  }
}

if (appShell && sidebarToggle) {
  let savedSidebarState = 'false';

  try {
    savedSidebarState = localStorage.getItem('sidebarCollapsed') || 'false';
  } catch (error) {
    savedSidebarState = 'false';
  }

  setSidebarCollapsed(savedSidebarState === 'true');

  sidebarToggle.addEventListener('click', () => {
    setSidebarCollapsed(!appShell.classList.contains('sidebar-collapsed'));
  });
}
