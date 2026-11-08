/* =========================================================
   quiz.js — draws a quiz and checks answers.
   Three question types (set "type" in the JSON):
     "mc"    multiple choice   { q, options:[...], answer: 0, why:[...optional reason per option] }
     "fill"  fill in the blank { q:"... ___ ...", answer:"text", accept:["other ok answers"] }
     "order" put in order      { q, items:[ listed in the CORRECT order ] }  (we shuffle them)
   Every question can also have: hint, explain (shown when right).
   No lives, no penalties: try as many times as you want.
   ========================================================= */
import { esc } from './util.js';
import { format } from './jargon.js';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  // Make sure an "order" question doesn't start already solved
  if (a.length > 1 && a.every((x, i) => x === arr[i])) a.push(a.shift());
  return a;
};

// Draw all questions into "box". onDone(right, total) is called when every question is answered.
// "right" counts questions you got on the FIRST try (just for your own info).
export function renderQuiz(box, questions, onDone) {
  const firstTry = new Array(questions.length).fill(null);
  const solved = new Array(questions.length).fill(false);

  box.innerHTML = questions.map((q, i) => `
    <div class="q" data-i="${i}">
      <p><strong>Q${i + 1}.</strong> ${format(q.q)}</p>
      <div class="answer-area"></div>
      <div class="row">
        <button class="btn small secondary" data-act="hint">Hint</button>
        <button class="btn small secondary" data-act="show">Show answer</button>
      </div>
      <div class="feedback" hidden aria-live="polite"></div>
    </div>`).join('');

  questions.forEach((q, i) => {
    const el = box.querySelector(`.q[data-i="${i}"]`);
    const area = el.querySelector('.answer-area');
    const fb = el.querySelector('.feedback');

    // Tell the user how they did. ok=true means solved.
    const tell = (ok, msg) => {
      if (firstTry[i] === null) firstTry[i] = ok;
      fb.hidden = false;
      fb.className = 'feedback ' + (ok ? 'good' : 'try');
      fb.innerHTML = (ok ? '✅ ' : '🤔 ') + format(msg);
      if (ok && !solved[i]) {
        solved[i] = true;
        if (solved.every(Boolean)) onDone(firstTry.filter(Boolean).length, questions.length);
      }
    };

    // "Show answer" is always allowed — it just doesn't count as a first-try success.
    const reveal = (msg) => { if (firstTry[i] === null) firstTry[i] = false; tell(true, msg); };

    el.querySelector('[data-act="hint"]').onclick = () => {
      fb.hidden = false; fb.className = 'feedback try';
      fb.innerHTML = '💭 ' + format(q.hint || 'Read the question slowly. Look for the key word.');
    };

    if (q.type === 'mc') {
      area.innerHTML = `<div class="options" role="group">${q.options.map((o, k) =>
        `<button class="option" data-k="${k}">${format(o)}</button>`).join('')}</div>`;
      area.querySelectorAll('.option').forEach((b) => b.onclick = () => {
        const k = +b.dataset.k;
        if (k === q.answer) { b.classList.add('right'); tell(true, q.explain || 'Yes! Well done.'); }
        else { b.classList.add('tried'); tell(false, (q.why && q.why[k]) || 'Not quite — and that’s okay. Try another one.'); }
      });
      el.querySelector('[data-act="show"]').onclick = () => {
        area.querySelector(`[data-k="${q.answer}"]`).classList.add('right');
        reveal('The answer is: **' + q.options[q.answer] + '**. ' + (q.explain || ''));
      };
    }

    if (q.type === 'fill') {
      area.innerHTML = `<div class="row"><label class="sr-only" for="f${i}">Your answer</label>
        <input id="f${i}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer">
        <button class="btn small" data-act="check">Check</button></div>`;
      const input = area.querySelector('input');
      const ok = [q.answer, ...(q.accept || [])].map((a) => a.toLowerCase().trim());
      const check = () => {
        const v = input.value.toLowerCase().trim();
        if (!v) return tell(false, 'Type something first — any guess is fine.');
        if (ok.includes(v)) tell(true, q.explain || 'Correct!');
        else tell(false, `"${esc(input.value)}" isn't it, but good try. ` + (q.hint ? 'Hint: ' + q.hint : 'Try again.'));
      };
      area.querySelector('[data-act="check"]').onclick = check;
      input.onkeydown = (e) => { if (e.key === 'Enter') check(); };
      el.querySelector('[data-act="show"]').onclick = () => { input.value = q.answer; reveal('The answer is **' + q.answer + '**. ' + (q.explain || '')); };
    }

    if (q.type === 'order') {
      const start = shuffle(q.items);
      area.innerHTML = `<p class="muted">Drag ☰ to reorder, or use the arrows.</p>
        <ol class="order-list">${start.map((t) => `<li data-v="${esc(t)}">
          <span class="grip" aria-hidden="true">☰</span><span class="txt">${format(t)}</span>
          <button aria-label="Move up">▲</button><button aria-label="Move down">▼</button></li>`).join('')}</ol>
        <button class="btn small" data-act="check">Check order</button>`;
      const list = area.querySelector('ol');
      enableDrag(list);
      list.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        const li = b.closest('li');
        if (b.getAttribute('aria-label') === 'Move up' && li.previousElementSibling) list.insertBefore(li, li.previousElementSibling);
        if (b.getAttribute('aria-label') === 'Move down' && li.nextElementSibling) list.insertBefore(li.nextElementSibling, li);
        b.focus();
      });
      const current = () => [...list.children].map((li) => li.dataset.v);
      area.querySelector('[data-act="check"]').onclick = () => {
        const cur = current();
        const rightSpots = cur.filter((v, k) => v === q.items[k]).length;
        if (rightSpots === q.items.length) tell(true, q.explain || 'Perfect order!');
        else tell(false, `${rightSpots} of ${q.items.length} are in the right spot. You're getting closer!`);
      };
      el.querySelector('[data-act="show"]').onclick = () => {
        q.items.forEach((v) => list.appendChild([...list.children].find((li) => li.dataset.v === esc(v) || li.dataset.v === v)));
        reveal('Here is the right order. ' + (q.explain || ''));
      };
    }
  });
}

// Drag-to-reorder with fingers or mouse (Pointer Events work on iPhone).
function enableDrag(list) {
  let dragging = null;
  list.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.grip')) return;   // only the ☰ handle starts a drag, so the page still scrolls
    dragging = e.target.closest('li');
    dragging.classList.add('dragging');
    dragging.setPointerCapture(e.pointerId);
  });
  list.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    // Find the item under the finger and move the dragged one before/after it
    const over = [...list.children].find((li) => {
      const r = li.getBoundingClientRect();
      return li !== dragging && e.clientY > r.top && e.clientY < r.bottom;
    });
    if (!over) return;
    const r = over.getBoundingClientRect();
    list.insertBefore(dragging, e.clientY < r.top + r.height / 2 ? over : over.nextElementSibling);
  });
  const stop = () => { if (dragging) dragging.classList.remove('dragging'); dragging = null; };
  list.addEventListener('pointerup', stop);
  list.addEventListener('pointercancel', stop);
}
