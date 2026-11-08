/* =========================================================
   db.js — saving your progress.
   Think of IndexedDB as a small filing cabinet inside the browser.
   We keep ONE folder ("state") holding everything:
     done: { lessonId: true }       finished lessons
     scores: { lessonId: {right, total} }
     bookmarks: { lessonId: true }
     notes: { lessonId: "my text" }
     settings: { level, theme, fontScale }
     lastLesson, lastExport (dates)
   If IndexedDB fails (e.g. private browsing), we use localStorage instead.
   ========================================================= */
const DB_NAME = 'techbasics';
const STORE = 'kv';
const KEY = 'state';
const LS_KEY = 'techbasics-state';

// The shape of a brand new, empty progress file.
// (Phase 3 will add things like xp, streak, badges here.)
export function emptyState() {
  return {
    version: 1,
    done: {}, scores: {}, bookmarks: {}, notes: {},
    settings: { level: 'normal', theme: 'auto', fontScale: 1 },
    lastLesson: null, lastExport: null, firstOpened: new Date().toISOString()
  };
}

let state = null;   // the copy we work with in memory
let idb = null;     // the open database, or null if unavailable

// Open the IndexedDB "filing cabinet".
function openDB() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

function idbGet() {
  return new Promise((resolve) => {
    const r = idb.transaction(STORE).objectStore(STORE).get(KEY);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => resolve(null);
  });
}

// Load saved progress once, when the app starts.
export async function loadState() {
  idb = await openDB();
  let saved = idb ? await idbGet() : null;
  if (!saved) { try { saved = JSON.parse(localStorage.getItem(LS_KEY)); } catch { saved = null; } }
  // Merge with empty state so new fields always exist
  const base = emptyState();
  state = saved ? { ...base, ...saved, settings: { ...base.settings, ...(saved.settings || {}) } } : base;
  // Ask the browser to keep our data (helps a little against iOS clearing it)
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  return state;
}

export function getState() { return state; }

// Save everything. Called after every change. We write to BOTH places for safety.
export function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  if (idb) {
    try { idb.transaction(STORE, 'readwrite').objectStore(STORE).put(state, KEY); } catch { /* ignore */ }
  }
}

// Change something, then save. Example: update(s => s.done['u1-l1'] = true)
export function update(fn) { fn(state); save(); }

export function resetAll() { state = emptyState(); save(); }

// Download progress as a .json file.
export function exportFile() {
  state.lastExport = new Date().toISOString();
  save();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'techbasics-progress-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// Read a .json file chosen by the user and replace current progress with it.
export async function importFile(file) {
  const data = JSON.parse(await file.text());
  if (!data || typeof data !== 'object' || !('done' in data)) throw new Error('This does not look like a TechBasics progress file.');
  const base = emptyState();
  state = { ...base, ...data, settings: { ...base.settings, ...(data.settings || {}) } };
  save();
}
