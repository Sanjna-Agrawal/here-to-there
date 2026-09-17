# Contributing

The most useful contribution is **adding or updating a state**.

## Add a state

1. Create `src/data/states/<state-name>.json` (lowercase, hyphens, like `new-jersey.json`). Files in that folder are picked up automatically.
2. Use this shape:

```json
{
  "state": "New Jersey",
  "code": "NJ",
  "lastReviewed": "2026-09-15",
  "sources": ["https://official.source/page"],
  "arriving": [],
  "leaving": []
}
```

3. Add tasks to `arriving` (for people moving in) and `leaving` (for people moving out). Each task looks like this:

```json
{
  "id": "license",
  "title": "Get a New Jersey driver's license",
  "detail": "New residents have 60 days.",
  "category": "government",
  "urgency": "urgent",
  "dueDays": 60,
  "link": { "label": "NJ MVC", "url": "https://..." }
}
```

| Field | Notes |
| --- | --- |
| `id` | Reusing an id from `src/data/general.json` (like `license`, `vote`, `car-register`, `state-taxes`, `withholding`, `health`) **replaces** the general task. A new id adds a task. |
| `category` | `before`, `car`, `government`, `money`, `business`, `life`, `after` |
| `urgency` | `urgent` (legal deadline or penalty), `soon`, `info` |
| `dueDays` | Days after the move date. Use a negative number for before the move. |
| `when` | Use instead of `dueDays` for timing like `"Next tax season"`. |
| `showIf` | Optional, e.g. `{ "vehicles": ["car"] }`. Keys and values come from `src/data/questions.json`. Unanswered questions never hide a task. |

## Rules for state data

- **Official sources only** (DMV, election office, tax department, state marketplace). List every page you used in `sources`.
- Put the deadline in `detail` in plain words, exactly as the source states it.
- Update `lastReviewed` whenever you check a file again.
- Run `npm run check-data` before opening a pull request.

## Add or change a question

Questions live in `src/data/questions.json`. Each has a `key`, the question `q`, a short `why`, a `type` (`single` or `multi`), and `opts` as `[value, label]` pairs. Add `askIf` to make it a follow-up, e.g. `{ "oldHousing": ["own"] }`. Only add a question if at least one task uses it in `showIf`.

## Code changes

Keep it dependency-light and keep everything in the browser. Changes that send user data to a server won't be merged.
