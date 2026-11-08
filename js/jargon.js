/* =========================================================
   jargon.js — the underlined words and their popup.

   In lesson JSON you write a jargon word like this:
     [[server]]            → shows "server", opens the "server" entry
     [[servers|server]]    → shows "servers", opens the "server" entry
   Also supported:  **bold**   and   `code`
   ========================================================= */
import { $, esc } from './util.js';
import { findTerm } from './content.js';

// Turn lesson text into safe HTML with clickable jargon buttons.
export function format(text = '') {
  return esc(text)
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, id, shown) =>
      `<button type="button" class="jargon" data-term="${id.toLowerCase()}" aria-haspopup="dialog">${shown || id}</button>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

// One listener for the whole page: any tap on a .jargon button opens the popup.
export function setupJargon() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.jargon');
    if (btn) openTerm(btn.dataset.term);
  });
  // Tap the dark area outside the popup to close it
  $('#jargon-dialog').addEventListener('click', (e) => {
    if (e.target.id === 'jargon-dialog') e.target.close();
  });
}

// Show a term in the popup. "full" = also show the "more" details.
export async function openTerm(id, full = false) {
  const t = await findTerm(id);
  const dlg = $('#jargon-dialog');
  const body = $('.dialog-body', dlg);
  if (!t) {
    body.innerHTML = `<h2 id="jargon-title">${esc(id)}</h2><p>This word isn't in the dictionary yet. You can add it to <code>data/dictionary.json</code>.</p>
      <button class="btn block" value="close">Close</button>`;
  } else {
    body.innerHTML = `
      <h2 id="jargon-title">${esc(t.term)}</h2>
      <div class="compare">${format(t.compare)}</div>
      <p><strong>Plain meaning:</strong> ${format(t.meaning)}</p>
      ${t.tagalog ? `<p class="muted"><em>Taglish:</em> ${esc(t.tagalog)}</p>` : ''}
      <div class="more" ${full ? '' : 'hidden'}>
        <p>${format(t.more || '')}</p>
        ${t.example ? `<p><strong>At work:</strong> ${format(t.example)}</p>` : ''}
      </div>
      <div class="row">
        ${full || !t.more ? '' : '<button class="btn secondary" data-act="more">More</button>'}
        <button class="btn secondary" data-act="speak" aria-label="Read aloud">🔊</button>
        <button class="btn" data-act="close">Close</button>
      </div>`;
    body.querySelector('[data-act="more"]')?.addEventListener('click', (e) => {
      body.querySelector('.more').hidden = false; e.currentTarget.remove();
    });
    body.querySelector('[data-act="speak"]').addEventListener('click', () =>
      speak(`${t.term}. ${t.compare} ${t.meaning}`.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1')));
  }
  body.querySelectorAll('[data-act="close"],[value="close"]').forEach((b) => b.addEventListener('click', () => dlg.close()));
  if (!dlg.open) dlg.showModal();
}

// Read text out loud with the phone's built-in voice (works on iPhone Safari).
export function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[*`]/g, ''));
  u.lang = 'en-US'; u.rate = 0.95;
  speechSynthesis.speak(u);
}
