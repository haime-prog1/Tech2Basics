/* Learning path: 8 units on a vertical "road".
   A unit is "unlocked" when every lesson in the units before it is finished.
   Locked units still let you open lessons — the lock is just a suggestion. */
import { getState } from '../db.js';
import { getUnits, getLessons } from '../content.js';
import { esc, setTitle } from '../util.js';
import { format } from '../jargon.js';

export async function render(main) {
  setTitle('Learning Path');
  const done = getState().done;
  const units = await getUnits();
  let unlocked = true; // the first unit is always unlocked
  let html = '<p class="muted">Follow the road from top to bottom. You can still open any lesson.</p><ol class="path">';

  for (const u of units) {
    const lessons = await getLessons(u);
    const finished = lessons.filter((l) => done[l.id]).length;
    const complete = lessons.length > 0 && finished === lessons.length;
    const cls = complete ? 'done' : unlocked ? 'unlocked' : 'locked';
    const status = complete ? '✓ Done' : unlocked ? 'Open' : '🔒 Later';

    const body = lessons.length
      ? `<div class="progress" aria-hidden="true"><i style="width:${(finished / lessons.length) * 100}%"></i></div>
         <p class="muted" style="margin-top:0">${finished} / ${lessons.length} lessons</p>
         <ul class="lesson-list">${lessons.map((l) => `<li><a href="#/lesson/${l.id}">
           <span>${done[l.id] ? '✅' : '⚪'} ${esc(l.title)}</span><span class="tag">${l.minutes || 5} min</span></a></li>`).join('')}</ul>`
      : `<p><span class="tag">Full lessons coming in Phase 4</span></p><p>What you'll learn:</p>
         <ul>${u.outline.map((o) => `<li>${format(o)}</li>`).join('')}</ul>`;

    html += `<li class="unit ${cls}">
      <span class="dot" aria-hidden="true">${complete ? '✓' : u.number}</span>
      <div class="card"><details ${unlocked && !complete && lessons.length ? 'open' : ''}>
        <summary>
          <div class="row spread"><h3 style="margin:0">Unit ${u.number}: ${esc(u.title)}</h3><span class="tag">${status}</span></div>
          <p class="muted" style="margin:.3em 0 0">${esc(u.tagline)}</p>
        </summary>
        ${body}
      </details></div></li>`;

    // The next unit unlocks only if this one is complete (units with no lessons yet don't block)
    if (lessons.length && !complete) unlocked = false;
  }
  main.innerHTML = html + '</ol>';
}
