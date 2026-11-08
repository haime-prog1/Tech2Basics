/* =========================================================
   Lesson reader.
   A lesson = several short cards (one idea each) + a final card with
   recap, "At my job", quiz, bookmark and notes.
   Swipe left/right (CSS scroll-snap does the swiping) or use Back/Next.
   Each card has 3 versions of the text: simple / normal / technical.
   ========================================================= */
import { getState, update } from '../db.js';
import { findLesson, getAllLessons } from '../content.js';
import { format, speak } from '../jargon.js';
import { renderQuiz } from '../quiz.js';
import { $, $$, esc, setTitle, toast } from '../util.js';

const LEVELS = [['simple', 'Super simple'], ['normal', 'Normal'], ['technical', 'Technical']];

// Draw one content card in the chosen level.
function cardHTML(c, level) {
  return `<h2>${esc(c.title)}</h2>
    ${c.compare ? `<div class="compare">${format(c.compare)}</div>` : ''}
    <p>${format(c[level] || c.normal)}</p>
    ${c.code ? `<pre><code>${esc(c.code)}</code></pre>` : ''}`;
}

export async function render(main, [id]) {
  const lesson = await findLesson(id);
  if (!lesson) { main.innerHTML = '<div class="card"><h2>Lesson not found</h2><a class="btn" href="#/path">Back to path</a></div>'; return; }
  setTitle(`Unit ${lesson.unit.number} · Lesson`);
  update((s) => { s.lastLesson = id; });

  const s = getState();
  let level = s.settings.level;
  const all = await getAllLessons();
  const nextL = all[all.findIndex((l) => l.id === id) + 1];
  const total = lesson.cards.length + 1; // +1 for the final "wrap-up" card

  main.innerHTML = `
    <div class="row spread"><a href="#/path" class="btn small secondary">‹ Path</a>
      <button class="btn small secondary" id="bm" aria-pressed="${!!s.bookmarks[id]}">${s.bookmarks[id] ? '🔖 Saved' : '🔖 Bookmark'}</button></div>
    <h2 style="margin-top:.6em">${esc(lesson.title)}</h2>
    <div class="levels" role="group" aria-label="Explanation level">
      ${LEVELS.map(([k, label]) => `<button data-level="${k}" aria-pressed="${k === level}">${label}</button>`).join('')}
    </div>
    <div class="deck" id="deck" aria-roledescription="carousel">
      ${lesson.cards.map((c, i) => `<section class="slide" aria-label="Card ${i + 1} of ${total}"><div class="card" data-card="${i}">${cardHTML(c, level)}</div></section>`).join('')}
      <section class="slide" aria-label="Card ${total} of ${total}"><div class="card">
        <h2>Recap</h2>
        <ul class="recap">${lesson.recap.map((r) => `<li>${format(r)}</li>`).join('')}</ul>
        <div class="job"><h3>🏢 At my job</h3><p>${format(lesson.atMyJob)}</p></div>
        <h2>Quick quiz</h2>
        <p class="muted">No pressure. Unlimited tries. Hints are always there.</p>
        <div id="quiz"></div>
        <div id="finish" class="notice" hidden></div>
        <h3>My notes</h3>
        <label class="sr-only" for="note">My notes for this lesson</label>
        <textarea id="note" placeholder="Write anything that helps you remember…">${esc(s.notes[id] || '')}</textarea>
        <p class="muted" id="note-status"></p>
        ${nextL ? `<a class="btn block" href="#/lesson/${nextL.id}">Next lesson: ${esc(nextL.title)} ›</a>` : ''}
      </div></section>
    </div>
    <div class="dots" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
    <div class="deck-nav">
      <button class="btn secondary" id="prev">‹ Back</button>
      <button class="btn secondary" id="say" aria-label="Read this card aloud">🔊</button>
      <button class="btn" id="next">Next ›</button>
    </div>`;

  const deck = $('#deck');
  const index = () => Math.round(deck.scrollLeft / deck.clientWidth);
  const go = (i) => deck.scrollTo({ left: Math.max(0, Math.min(total - 1, i)) * deck.clientWidth, behavior: 'smooth' });

  // Update the dots and buttons while swiping
  deck.addEventListener('scroll', () => {
    const i = index();
    $$('.dots i').forEach((d, k) => d.classList.toggle('on', k === i));
    $('#prev').disabled = i === 0;
    $('#next').disabled = i === total - 1;
  }, { passive: true });
  $('#prev').disabled = true;
  $('#prev').onclick = () => go(index() - 1);
  $('#next').onclick = () => go(index() + 1);
  // Keyboard: left/right arrows move cards (when not typing)
  main.onkeydown = (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowRight') go(index() + 1);
    if (e.key === 'ArrowLeft') go(index() - 1);
  };
  $('#say').onclick = () => speak($$('.slide .card')[index()].innerText);

  // Level toggle: redraw card text, remember the choice
  $$('.levels button').forEach((b) => b.onclick = () => {
    level = b.dataset.level;
    update((st) => { st.settings.level = level; });
    $$('.levels button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    $$('[data-card]').forEach((el) => { el.innerHTML = cardHTML(lesson.cards[+el.dataset.card], level); });
  });

  // Bookmark on/off
  $('#bm').onclick = (e) => {
    update((st) => { if (st.bookmarks[id]) delete st.bookmarks[id]; else st.bookmarks[id] = true; });
    const on = !!getState().bookmarks[id];
    e.currentTarget.textContent = on ? '🔖 Saved' : '🔖 Bookmark';
    e.currentTarget.setAttribute('aria-pressed', on);
    toast(on ? 'Bookmarked' : 'Bookmark removed');
  };

  // Notes save automatically, half a second after you stop typing
  let t;
  $('#note').oninput = (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      update((st) => { if (e.target.value.trim()) st.notes[id] = e.target.value; else delete st.notes[id]; });
      $('#note-status').textContent = 'Saved ✓';
    }, 500);
  };

  // Quiz: when every question is solved, mark the lesson done
  renderQuiz($('#quiz'), lesson.quiz, (right, totalQ) => {
    update((st) => {
      st.done[id] = true;
      const prev = st.scores[id];
      st.scores[id] = { right, total: totalQ, best: Math.max(right, prev?.best || 0), date: new Date().toISOString() };
    });
    const f = $('#finish');
    f.hidden = false;
    f.innerHTML = `🎉 <strong>Lesson complete!</strong> You got ${right} of ${totalQ} on the first try. Every answer counts as learning.`;
    toast('Lesson complete!');
  });
}
