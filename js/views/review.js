/* Review page: your bookmarks, notes and quiz scores in one place.
   (Phase 2 will add flashcard spaced review here.) */
import { getState } from '../db.js';
import { getAllLessons } from '../content.js';
import { esc, setTitle } from '../util.js';

export async function render(main) {
  setTitle('Review');
  const s = getState();
  const all = await getAllLessons();
  const byId = Object.fromEntries(all.map((l) => [l.id, l]));
  const link = (id) => byId[id] ? `<a href="#/lesson/${id}">${esc(byId[id].title)}</a>` : esc(id);

  const bms = Object.keys(s.bookmarks).filter((id) => byId[id]);
  const notes = Object.entries(s.notes).filter(([id]) => byId[id]);
  const scores = Object.entries(s.scores).filter(([id]) => byId[id]);

  main.innerHTML = `
    <section class="card"><h2>🔖 Bookmarks</h2>
      ${bms.length ? `<ul>${bms.map((id) => `<li>${link(id)}</li>`).join('')}</ul>` : '<p class="muted">No bookmarks yet. Tap 🔖 in a lesson to save it here.</p>'}
    </section>
    <section class="card"><h2>📝 My notes</h2>
      ${notes.length ? notes.map(([id, n]) => `<h3>${link(id)}</h3><p style="white-space:pre-wrap">${esc(n)}</p>`).join('') : '<p class="muted">No notes yet. Each lesson has a notes box at the end.</p>'}
    </section>
    <section class="card"><h2>✅ Quiz results</h2>
      ${scores.length ? `<ul>${scores.map(([id, sc]) => `<li>${link(id)} — ${sc.right}/${sc.total} on first try</li>`).join('')}</ul>
        <p class="muted">Want to practice? Open any lesson again — quizzes can be retaken anytime.</p>` : '<p class="muted">Finish a quiz and your result shows here.</p>'}
    </section>`;
}
