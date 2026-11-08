/* Home screen: greeting, today's lesson, progress bar, Continue button, backup reminder. */
import { getState } from '../db.js';
import { getAllLessons } from '../content.js';
import { esc, setTitle } from '../util.js';

// Pick a greeting based on the time of day.
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export async function render(main) {
  setTitle('Home');
  const s = getState();
  const all = await getAllLessons();
  const doneCount = all.filter((l) => s.done[l.id]).length;
  const pct = all.length ? Math.round((doneCount / all.length) * 100) : 0;

  // "Today's lesson" = the first lesson not finished yet.
  const next = all.find((l) => !s.done[l.id]) || all[all.length - 1];
  // If you opened a lesson and didn't finish it, offer that one instead.
  const last = s.lastLesson && all.find((l) => l.id === s.lastLesson);
  const resuming = last && !s.done[last.id];
  const cont = resuming ? last : next;

  // Backup reminder: iOS may clear website data if the app isn't opened for weeks.
  const days = s.lastExport ? (Date.now() - new Date(s.lastExport)) / 864e5 : Infinity;
  const showBackup = doneCount > 0 && days > 14;

  main.innerHTML = `
    <section class="card">
      <h2>${greeting()}! 👋</h2>
      <p class="muted">Small steps every day. Kaya mo 'to.</p>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Overall progress">
        <i style="width:${pct}%"></i></div>
      <p class="muted">${doneCount} of ${all.length} lessons done (${pct}%)</p>
    </section>

    ${showBackup ? `<div class="notice"><strong>Backup reminder:</strong> iPhone can erase website data if the app isn't opened for a few weeks.
      Export your progress now and then. <a href="#/settings">Go to Settings → Export</a></div>` : ''}

    <section class="card">
      <p class="muted">${resuming ? 'Continue where you left off' : "Today's lesson"}</p>
      <h2>${esc(cont.title)}</h2>
      <p class="muted">Unit ${cont.unit.number}: ${esc(cont.unit.title)} · about ${cont.minutes || 5} min</p>
      <a class="btn block" href="#/lesson/${cont.id}">Continue ▶</a>
    </section>

    <section class="card">
      <h3>Quick tips</h3>
      <ul>
        <li>Tap any <button class="jargon" data-term="jargon">dotted word</button> to see what it means.</li>
        <li>Use the <strong>Super simple / Normal / Technical</strong> switch in lessons.</li>
        <li>Mistakes are fine. There are no lives — retry as much as you like.</li>
      </ul>
    </section>`;
}
