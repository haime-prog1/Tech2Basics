/* Small helper tools used by many files. */

// Find one element on the page. $('#main') is shorter than document.querySelector('#main').
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Make text safe to put inside HTML (so "<" in a lesson isn't treated as a real tag).
export function esc(text = '') {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Show a short message at the bottom of the screen for 2 seconds.
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// Set the title in the top bar and the browser tab.
export function setTitle(text) {
  $('#screen-title').textContent = text;
  document.title = text + ' · TechBasics';
}
