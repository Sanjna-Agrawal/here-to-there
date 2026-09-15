# Here to There

Moving within the US means updating your address in dozens of places and handling state rules you've never heard of. Here to There does two things:

1. **Finds everywhere your old address is on file.** It scans your Gmail for senders that mention your old street or ZIP, plus receipts and statements, so you're not relying on memory.
2. **Builds a checklist for your move.** It's based on the state you're leaving, the state you're moving to, and a few quick questions (car, renting or buying, payroll, health insurance, business). Each task has a link to the right site and a due date counted from your move date.

## Privacy

- **No server, no account, no database.** Your progress is saved in your own browser (`localStorage`).
- **The Gmail scan runs in your browser.** It asks Google for read-only access, then reads only the **From** and **Date** of matching emails. It never downloads email bodies, and your access token stays in memory until you close the tab.
- The only network requests are to Google (sign-in and the Gmail API) and Google Fonts.

## Run it

```bash
git clone https://github.com/Sanjna-Agrawal/here-to-there.git
cd here-to-there
npm install
npm run dev
```

Open http://localhost:5173. Everything except the Gmail scan works right away.

### Turn on the Gmail scan

Create a free Google Cloud project and an OAuth client ID. It takes about 10 minutes, and the steps are in [docs/google-setup.md](docs/google-setup.md). Then:

```bash
cp .env.example .env.local
# paste your client ID into VITE_GOOGLE_CLIENT_ID
npm run dev
```

While your Google project is in "Testing" mode, only the Google accounts you add as test users can connect. That's the right setup for personal use.

## Deploy

It's a static site. On Vercel or Netlify: import the repo, build command `npm run build`, output folder `dist`, and add `VITE_GOOGLE_CLIENT_ID` as an environment variable if you want the scan. Add the deployed URL to your OAuth client's **Authorized JavaScript origins**.

A public site where anyone can connect Gmail needs Google's app verification first, because Gmail read access is a restricted scope. Until then, the checklist works for everyone and the scan works for your test users.

## State coverage

| State | Moving in | Moving out |
| --- | --- | --- |
| Virginia | ✅ | — |
| New York | — | ✅ |
| Everything else | General checklist | General checklist |

Every state file lists its official sources and the date it was last checked. **Help add your state:** see [CONTRIBUTING.md](CONTRIBUTING.md).

## How it's organized

```
src/
  data/general.json        tasks that apply to every move
  data/states/*.json       state-specific tasks (override general ones by id)
  checklist.ts             merges tasks and filters them by your answers
  gmail.ts                 in-browser Gmail scan
  steps/                   the four screens
```

## Disclaimer

This is a checklist, not legal or tax advice. Rules and deadlines change, so confirm them with the official source linked on each task.

## License

MIT
