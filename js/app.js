/* =========================================================
   app.js — the starting point.
   1. Loads your saved progress.
   2. Applies your settings (theme, text size).
   3. Watches the address "#/..." and shows the matching screen.
      #/home  #/path  #/lesson/u1-l2  #/dictionary  #/review  #/settings
   To add a new screen later (Phase 2 playground, Phase 3 stats):
   make js/views/NAME.js with a render(main, params) function, then add it to ROUTES.
   ========================================================= */
import { loadState, getState } from './db.js';
import { setupJargon } from './jargon.js';
import { $, $$ } from './util.js';
import * as home from './views/home.js';
import * as path from './views/path.js';
import * as lesson from './views/lesson.js';
import * as dictionary from './views/dictionary.js';
import * as review from './views/review.js';
import * as settings from './views/settings.js';

const ROUTES = { home, path, lesson, dictionary, review, settings };

// Apply theme + text size from settings to the <html> tag.
export function applySettings() {
  const s = getState().settings;
  const root = document.documentElement;
  if (s.theme === 'auto') root.removeAttribute('data-theme');
  else root.dataset.theme = s.theme;
  root.style.setProperty('--font-scale', s.fontScale);
}

// Read the address and draw the right screen.
async function route() {
  const [name = 'home', ...params] = location.hash.replace(/^#\/?/, '').split('/');
  const view = ROUTES[name] || home;
  const main = $('#main');

  // Highlight the active tab (a lesson counts as part of "Path")
  const tab = name === 'lesson' ? 'path' : (ROUTES[name] ? name : 'home');
  $$('.tabbar a').forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  try {
    await view.render(main, params.map(decodeURIComponent));
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="card"><h2>Something went wrong</h2><p>${err.message}</p><a class="btn" href="#/home">Go home</a></div>`;
  }
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true }); // screen readers start reading the new screen
}

async function start() {
  await loadState();
  applySettings();
  setupJargon();
  window.addEventListener('hashchange', route);
  if (!location.hash) location.replace('#/home');
  route();
  // Register the service worker (offline support). Needs https:// or http://localhost.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker failed', e));
  }
}

start();
