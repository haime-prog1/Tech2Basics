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
    <div class="progress lesson-progress" aria-hidden="true"><i id="lp" style="width:${100 / total}%"></i></div>
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
    <div class="deck-bar">
    <div class="dots" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
    <div class="deck-nav">
      <button class="btn secondary" id="prev">‹ Back</button>
      <button class="btn secondary" id="say" aria-label="Read this card aloud">🔊</button>
      <button class="btn" id="next">Next ›</button>
    </div></div>`;

  /* ----- Card switching -----
     Only ONE card is shown at a time (the others are hidden).
     Why not a sideways-scrolling strip? On iPhone, a sideways strip also grabs
     up/down finger movement, so you couldn't scroll down to the quiz.
     Now: up/down = normal page scroll; a clear left/right swipe = change card. */
  const deck = $('#deck');
  const slides = $$('.slide', deck);
  let current = 0;

  function show(i, direction = 0) {
    i = Math.max(0, Math.min(total - 1, i));
    if (i === current && direction !== 0) return;
    current = i;
    slides.forEach((s, k) => { s.hidden = k !== i; });
    // Slide-in animation from the side you swiped toward
    const s = slides[i];
    s.classList.remove('from-left', 'from-right');
    if (direction) { void s.offsetWidth; s.classList.add(direction > 0 ? 'from-right' : 'from-left'); }
    $('#lp').style.width = ((i + 1) / total) * 100 + '%'; // lesson progress bar at the top
    $$('.dots i').forEach((d, k) => d.classList.toggle('on', k === i));
    $('#prev').disabled = i === 0;
    $('#next').disabled = i === total - 1;
    // When changing card, bring the top of the card into view
    if (direction) deck.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const go = (i) => show(i, i > current ? 1 : -1);
  show(0);

  // Swipe detection: remember where the finger started, compare where it ended.
  let sx = 0, sy = 0;
  deck.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  deck.addEventListener('touchend', (e) => {
    if (e.target.closest('.order-list, input, textarea')) return; // don't steal drags in the quiz
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    // Must be a clear sideways swipe: at least 60px, and more sideways than up/down
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1));
  }, { passive: true });

  $('#prev').onclick = () => go(current - 1);
  $('#next').onclick = () => go(current + 1);
  // Keyboard: left/right arrows move cards (when not typing)
  main.onkeydown = (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowRight') go(current + 1);
    if (e.key === 'ArrowLeft') go(current - 1);
  };
  $('#say').onclick = () => speak(slides[current].innerText);

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
