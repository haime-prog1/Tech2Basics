/* =========================================================
   content.js — loads the lesson words from the data/ folder.
   units.json  = the list of units (title, outline, which file has lessons)
   unitN.json  = full lessons for one unit
   dictionary.json = all jargon words
   Files are loaded once and remembered ("cached in memory").
   ========================================================= */
const memory = {};

async function getJSON(path) {
  if (!memory[path]) {
    memory[path] = fetch(path).then((r) => {
      if (!r.ok) throw new Error('Could not load ' + path);
      return r.json();
    });
  }
  return memory[path];
}

export const getUnits = () => getJSON('data/units.json').then((d) => d.units);
export const getDictionary = () => getJSON('data/dictionary.json').then((d) => d.terms);

// Lessons for one unit. Units without a "file" yet return an empty list.
export async function getLessons(unit) {
  if (!unit.file) return [];
  const data = await getJSON('data/' + unit.file);
  return data.lessons;
}

// A flat list of every lesson in order, with its unit attached. Handy for "next lesson".
export async function getAllLessons() {
  const units = await getUnits();
  const all = [];
  for (const u of units) {
    for (const l of await getLessons(u)) all.push({ ...l, unit: u });
  }
  return all;
}

export async function findLesson(id) {
  return (await getAllLessons()).find((l) => l.id === id);
}

// Look up a dictionary term by its id OR any of its alternative spellings.
export async function findTerm(key) {
  const k = key.toLowerCase();
  return (await getDictionary()).find((t) => t.id === k || (t.aliases || []).includes(k));
}
