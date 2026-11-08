/* Settings: text size, theme, export/import, reset. */
import { getState, update, exportFile, importFile, resetAll } from '../db.js';
import { applySettings } from '../app.js';
import { $, setTitle, toast } from '../util.js';

export function render(main) {
  setTitle('Settings');
  const s = getState().settings;
  const last = getState().lastExport;

  main.innerHTML = `
    <section class="card">
      <h2>Text size</h2>
      <label for="fs" class="sr-only">Text size</label>
      <input id="fs" type="range" min="0.85" max="1.4" step="0.05" value="${s.fontScale}" style="width:100%;min-height:44px">
      <p class="muted">Drag to make text smaller or bigger.</p>
    </section>

    <section class="card">
      <h2>Theme</h2>
      <label for="theme" class="sr-only">Theme</label>
      <select id="theme">
        <option value="auto" ${s.theme === 'auto' ? 'selected' : ''}>Follow my phone</option>
        <option value="light" ${s.theme === 'light' ? 'selected' : ''}>Light</option>
        <option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Dark</option>
      </select>
    </section>

    <section class="card">
      <h2>Backup my progress</h2>
      <p>iPhone may erase website data if you don't open the app for a few weeks. Export a backup file now and then (save it to Files or iCloud Drive).</p>
      <p class="muted">Last export: ${last ? new Date(last).toLocaleDateString() : 'never'}</p>
      <div class="row">
        <button class="btn" id="export">⬇️ Export</button>
        <label class="btn secondary" for="import" tabindex="0">⬆️ Import</label>
        <input id="import" type="file" accept="application/json,.json" class="sr-only">
      </div>
    </section>

    <section class="card">
      <h2>Start over</h2>
      <p class="muted">Erases all progress, notes and bookmarks on this device.</p>
      <button class="btn secondary" id="reset">Reset progress</button>
    </section>

    <p class="muted">TechBasics · works offline after your first visit.</p>`;

  $('#fs').oninput = (e) => { update((st) => { st.settings.fontScale = +e.target.value; }); applySettings(); };
  $('#theme').onchange = (e) => { update((st) => { st.settings.theme = e.target.value; }); applySettings(); };
  $('#export').onclick = () => { exportFile(); toast('Backup file downloaded'); render(main); };
  $('label[for="import"]').onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') $('#import').click(); };
  $('#import').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try { await importFile(file); applySettings(); toast('Progress imported!'); render(main); }
    catch (err) { alert('Could not import: ' + err.message); }
  };
  $('#reset').onclick = () => {
    if (confirm('Really erase all progress? Tip: Export first so you can undo this.')) {
      resetAll(); applySettings(); toast('Progress reset'); render(main);
    }
  };
}
