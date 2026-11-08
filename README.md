# TechBasics

A calm, beginner-friendly app for learning how websites, servers and code work, one small step at a time.
It's plain HTML, CSS and JavaScript: no frameworks, no build step, no backend.
It works offline and installs on your iPhone like a real app.

---

## What each file does

| File | What it does (plain words) |
|---|---|
| `index.html` | The only page. It has the top bar, the bottom tabs and an empty `<main>` where screens are drawn. Also has the iPhone "real app" settings. |
| `manifest.json` | The app's "ID card": name, icons, colors, "open full-screen". Makes it installable. |
| `sw.js` | The **service worker**. It saves a copy of every file on your first visit, so the app works offline. |
| `css/styles.css` | All the looks: colors, dark mode, text size, tab bar, notch-safe spacing. |
| `js/app.js` | The starting point. Loads your progress, then shows the right screen based on the address (`#/home`, `#/lesson/u1-l2`…). |
| `js/db.js` | Saving. Keeps progress, scores, bookmarks, notes and settings in IndexedDB (with localStorage as backup). Also Export/Import. |
| `js/content.js` | Loads the lesson and dictionary files from `data/`. |
| `js/jargon.js` | Turns `[[words]]` into underlined buttons and shows the popup. Also does read-aloud. |
| `js/quiz.js` | The three quiz types: multiple choice, fill-in-the-blank, drag-to-order. |
| `js/util.js` | Small helpers used everywhere. |
| `js/views/*.js` | One file per screen: `home`, `path`, `lesson`, `dictionary`, `review`, `settings`. |
| `data/units.json` | The 8 units: titles, short outlines, and which file holds the full lessons. |
| `data/unit1.json`, `data/unit3.json` | Full lessons for Unit 1 and Unit 3. |
| `data/dictionary.json` | All the jargon words (84 so far). |
| `icons/` | The app icon (`icon.svg`) and the PNG sizes iPhone and Android need. |

---

## How to add a new lesson (no coding needed)

1. Open the unit file, for example `data/unit1.json`.
2. Copy one whole lesson (from `{ "id": ...` to its matching `}`) and paste it after the last one. Put a comma between lessons.
3. Change the `id` to something new, like `"u1-l6"`. **Each id must be different.**
4. Edit the words. A lesson looks like this:

```json
{
  "id": "u1-l6",
  "title": "My new lesson",
  "minutes": 5,
  "cards": [
    {
      "title": "One idea per card",
      "compare": "The everyday comparison goes here (shown first).",
      "simple": "Super simple version. Use [[server]] to underline a word.",
      "normal": "Normal version.",
      "technical": "Technical version.",
      "code": "optional code example"
    }
  ],
  "recap": ["Point 1", "Point 2", "Point 3"],
  "atMyJob": "Where this shows up in WordPress / the server / the network.",
  "quiz": [
    { "type": "mc", "q": "Question?", "options": ["A", "B", "C"], "answer": 1,
      "explain": "Shown when right", "hint": "A small clue",
      "why": ["Kind reason why A is wrong", "", "Kind reason why C is wrong"] },
    { "type": "fill", "q": "The ___ answers requests.", "answer": "server", "accept": ["a server"] },
    { "type": "order", "q": "Put in order:", "items": ["First", "Second", "Third"] }
  ]
}
```

Notes:
- `answer` in multiple choice counts from **0**, so `1` means the second option.
- For `order` questions, list the items in the **correct** order. The app shuffles them.
- `**bold**` makes bold text. Backticks make `code`.
- **Raise the version number** at the top of `sw.js` (`techbasics-v1` → `techbasics-v2`) after any change, or your iPhone will keep showing the old saved copy.
- Check your JSON for missing commas at <https://jsonlint.com> if the app says "Something went wrong".

### Adding a whole new unit's lessons (for example Unit 2)
1. Create `data/unit2.json` with the same shape as `unit1.json`.
2. In `data/units.json`, change Unit 2's `"file": null` to `"file": "unit2.json"`.
3. Add `'./data/unit2.json'` to the `FILES` list in `sw.js`, and raise the version.

## How to add a jargon word
Add one entry to `data/dictionary.json`:
```json
{ "id": "proxy", "term": "Proxy", "aliases": ["proxies"],
  "compare": "Like asking a friend to buy something for you.",
  "meaning": "A server that makes requests for you.",
  "more": "Longer explanation shown when you tap More.",
  "example": "Where you see it at work." }
```
Then write `[[proxy]]` in any lesson. To show a different word than the id, write `[[proxy|proxies]]`. The first part is the dictionary id and the second is the text shown.

---

## Run it on your computer

- **XAMPP:** copy the whole folder into `C:\xampp\htdocs\techbasics`, start Apache, open `http://localhost/techbasics/`.
- **Or with Python:** in the folder run `python -m http.server 8000` and open `http://localhost:8000`.

Opening `index.html` by double-clicking does **not** work, because browsers block loading the JSON files from `file://`.

---

## Put it on GitHub Pages (needed for iPhone offline mode, which requires HTTPS)

1. Go to your repository on github.com.
2. Click **Settings**, then **Pages** (left menu).
3. Under **Build and deployment**, set Source to **Deploy from a branch**.
4. Pick the branch (for example `main`) and the folder `/ (root)`, then click **Save**.
5. Wait 1–2 minutes. The page shows your address, like `https://YOUR-NAME.github.io/Tech2Basics/`.

## Install it on your iPhone

1. Open the GitHub Pages address in **Safari**. It has to be Safari.
2. Wait until the Home screen of the app appears (this first visit saves everything for offline use).
3. Tap the **Share** button (the square with an arrow up).
4. Scroll down and tap **Add to Home Screen**, then **Add**.
5. Open TechBasics from your Home Screen. It opens full-screen.
6. Test offline: turn on Airplane Mode and open the app. It should still work.

**Back up now and then:** Settings → Export. iOS may delete website data if the app isn't opened for several weeks. Save the file to Files or iCloud Drive. Use Import to bring it back.

---

## Ready for later phases
- **Phase 2 (playground, projects, flashcards):** add a new file in `js/views/` with a `render(main)` function and add it to `ROUTES` in `js/app.js`.
- **Phase 3 (XP, streaks, badges):** add new fields in `emptyState()` in `js/db.js`. Old saved progress automatically gets the new fields.
- **Phase 4 (Tagalog toggle):** dictionary entries can already hold a `"tagalog"` field, and the popup shows it if present.
