/* Jargon Dictionary page: search box + list of all terms. Tap one to open the full popup. */
import { getDictionary } from '../content.js';
import { openTerm, format } from '../jargon.js';
import { $, esc, setTitle } from '../util.js';

export async function render(main) {
  setTitle('Jargon Dictionary');
  const terms = (await getDictionary()).slice().sort((a, b) => a.term.localeCompare(b.term));

  main.innerHTML = `
    <label for="q" class="sr-only">Search words</label>
    <input id="q" type="search" placeholder="Search ${terms.length} words…" autocomplete="off">
    <p class="muted" id="count" aria-live="polite"></p>
    <ul class="dict-list" id="list"></ul>`;

  const draw = (filter = '') => {
    const f = filter.toLowerCase().trim();
    const shown = terms.filter((t) => !f || (t.term + ' ' + t.meaning + ' ' + (t.aliases || []).join(' ')).toLowerCase().includes(f));
    $('#count').textContent = `${shown.length} word${shown.length === 1 ? '' : 's'}`;
    $('#list').innerHTML = shown.map((t) => `<li><button class="card" data-id="${t.id}">
      <strong>${esc(t.term)}</strong><br><span class="muted">${format(t.meaning).replace(/<button[^>]*>|<\/button>/g, '')}</span></button></li>`).join('');
  };
  draw();
  $('#q').oninput = (e) => draw(e.target.value);
  $('#list').onclick = (e) => { const b = e.target.closest('[data-id]'); if (b) openTerm(b.dataset.id, true); };
}
