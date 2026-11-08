/* Home screen: greeting, today's lesson, progress bar, Continue button, backup reminder. */
import { getState } from '../db.js';
import { getAllLessons, getDictionary } from '../content.js';
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

  // Progress ring: a circle whose colored stroke length shows the percent.
  // Circumference of a circle with radius 38 = 2 × π × 38 ≈ 238.8
  const C = 238.8;
  const termCount = (await getDictionary()).length;
  const bookmarks = Object.keys(s.bookmarks).length;

  main.innerHTML = `
    <section class="card hero">
      <div style="position:relative;z-index:1;flex:1">
        <h2>${greeting()}! 👋</h2>
        <p>Small steps every day. Kaya mo 'to.</p>
        <p style="margin-top:8px;font-weight:600">${doneCount} of ${all.length} lessons done</p>
      </div>
      <div class="ring" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Overall progress ${pct}%">
        <svg viewBox="0 0 88 88" aria-hidden="true">
          <circle class="track" cx="44" cy="44" r="38"/>
          <circle class="bar" cx="44" cy="44" r="38" stroke-dasharray="${C}" stroke-dashoffset="${C - (C * pct) / 100}"/>
        </svg>
        <span>${pct}%</span>
      </div>
    </section>

    <div class="stats">
      <a class="card" href="#/path" style="text-decoration:none"><strong>${doneCount}</strong><span>Lessons done</span></a>
      <a class="card" href="#/dictionary" style="text-decoration:none"><strong>${termCount}</strong><span>Words to learn</span></a>
      <a class="card" href="#/review" style="text-decoration:none"><strong>${bookmarks}</strong><span>Bookmarks</span></a>
    </div>

    ${showBackup ? `<div class="notice"><strong>Backup reminder:</strong> iPhone can erase website data if the app isn't opened for a few weeks.
      Export your progress now and then. <a href="#/settings">Go to Settings → Export</a></div>` : ''}

    <section class="card">
      <p class="eyebrow">${resuming ? 'Continue where you left off' : "Today's lesson"}</p>
      <h2>${esc(cont.title)}</h2>
      <div class="meta"><span class="tag">Unit ${cont.unit.number}</span><span class="tag">⏱ ${cont.minutes || 5} min</span><span class="tag">${cont.cards.length} cards + quiz</span></div>
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
