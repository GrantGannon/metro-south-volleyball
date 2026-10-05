# Volleyball Tournament Desk

A phone-friendly website for running a school or club volleyball tournament. Families open one link and see live scores, the bracket, game times, and announcements. The page updates as points are scored, with no refreshing. Scorers sign in on their own phones to keep score, move winners along, and post announcements.

It was built for the 2026 Metro-South 8th Grade Girls Volleyball tournament, where it ran a 12-team double-elimination weekend. Clone it, point it at a database, and run your own.

## What it does

**For families (no login)**

- **Now:** games being played, with live set scores, plus what's up next.
- **Bracket:** winners, losers, and finals. Open slots read like "Winner of Simmons v Hewitt" until the game is decided.
- **Results:** finished games.
- **My team:** pick your kid's team and see only their games.
- Can be added to the phone's home screen like an app, and shows the last scores it saw if the gym Wi-Fi drops.

**For scorers (password)**

- Tap +1 to score, or type a score in by hand. Sets and matches end on their own based on your scoring rules.
- Award a forfeit when a team can't play. You still advance that winner yourself, the same way you advance a scored game.
- Advance a winner (and, in double elimination, the loser) into their next games with one confirm. Undo is there if someone taps too fast.
- Championship "if necessary" game: if the losers-bracket champ wins the first final, one button sets up the second game.
- Edit times, courts, team names, and which game feeds which on a desktop bracket board.
- Post announcements ("Court 2 is running 15 minutes behind").

## What you need

- A free [GitHub](https://github.com) account, to hold your copy of the code.
- A host that can run a Node.js app and a Postgres database. These steps use [Railway](https://railway.com), which handles both. Render or Fly.io also work if you're comfortable with them.
- About 30 minutes before the tournament to enter teams and times.

You don't need to write any code.

## Put it online with Railway

1. **Copy the code.** On GitHub, click **Fork** on this repo, or clone it and push it to your own repo.
2. **Create a Railway project.** In Railway, choose **New Project → Deploy from GitHub repo** and pick your copy.
3. **Add a database.** In the same project, click **+ New → Database → PostgreSQL**.
4. **Set the variables.** Open your web service (not the database), go to **Variables**, and add:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway fills this in from the database) |
   | `ADMIN_PASSWORD` | The password your scorers will type |
   | `AUTH_SECRET` | Any long random string. It signs admin logins, so keep it private |

5. **Give it a web address.** Under the web service's **Settings → Networking**, click **Generate Domain**. If Railway asks for a port, use `8080` and also add a `PORT` variable set to `8080`.
6. **Deploy.** Railway builds and starts the app. On every start it updates the database tables and then serves the site. A new database starts empty.

Keep it at **one** web replica. Live updates go out from a single server, so a second copy would show stale scores.

Every push to your repo's main branch redeploys. Your teams, games, and scores live in the database, so redeploying does not erase them.

## Set up your tournament

Open `https://your-address/admin` and sign in with `ADMIN_PASSWORD`.

1. **Settings → Tournament.** Enter the full name ("Riverside 7th Grade Girls Volleyball") and a short name ("Riverside"). The short name shows large at the top of every page, and the rest of the name sits underneath. Choose single or double elimination and save.
2. **Settings → Teams.** Add each team. Seed 1 is the top seed. You can rename and reseed later.
3. **Settings → Build bracket.** This creates every game and connects winners (and losers) to their next games. Teams that get byes move straight to round two.
4. **Bracket.** Set each game's date, start time, and court. On a laptop you get the full board: click a game, and the games it feeds light up.
5. **Settings → Scoring rules.** Choose heads up (one set), best of 3, or best of 5. Defaults are best of 3, sets to 25, deciding set to 15, win by 2. Add a point cap if your league uses one.

Then share the main address with families. A QR code on the gym door works well.

### Bracket sizes

| Format | Team counts the builder handles |
| --- | --- |
| Single elimination | 2 to 32. Byes fill out the field. |
| Double elimination | 4, 8, 16, or 32 |

Double elimination with other counts (like the 12-team original) can be built by hand. Add games on the **Bracket** page, then set where each winner and loser goes. It takes a while, but every link is editable and the board shows you what feeds what.

**Building a bracket replaces every game, including any scores already entered.** The app asks before it does that. Changing single/double in Settings on its own does not touch your games.

## Running it on your computer

You'll need [Node.js](https://nodejs.org) 20 or newer and a Postgres database.

```bash
git clone https://github.com/YOUR-NAME/YOUR-REPO.git
cd YOUR-REPO
npm install
cp .env.example .env    # then edit the three values
npm run build
npm start
```

Open http://localhost:3000. For live editing while you change code, use `npm run dev`.

No Postgres handy? The project includes PGlite, a small Postgres that runs inside Node:

```bash
npx pglite-server -d .pglite -p 5433
```

Then use this in `.env`:

```
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable&connection_limit=1&pgbouncer=true"
```

Run the tests with `npm test`.

## Things to know

- **Time zone.** Game times use `America/Chicago`. If your tournament is somewhere else, change `TIME_ZONE` in `lib/format.ts`.
- **Example draw.** `prisma/tournament.json` holds the original 12-team placeholder bracket. Load it into an empty database with `node prisma/seed.mjs --import`.
- **Careful with reset.** `node prisma/seed.mjs --reset`, or setting `TOURNAMENT_RESET=1` on your host, deletes all teams, games, scores, and announcements, then loads the example draw. If you ever set that variable, remove it right after, or the next restart wipes your tournament again.
- **Phones remember the last scores.** If someone's phone loses signal, it keeps showing what it last saw and catches up when it reconnects.

## Built with

Next.js, React, Tailwind CSS, Prisma, and Postgres.

## License

[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0). You can use, copy, and change this for a school, club, or any other noncommercial tournament, including one that charges an entry fee to cover the gym, refs, and medals. Selling the software, or charging people for access to it, needs permission from the copyright holder.

Required Notice: Copyright 2026 GrantGannon
