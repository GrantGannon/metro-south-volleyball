import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const force = process.argv.includes("--reset") || process.env.TOURNAMENT_RESET === "1";
const importDraw = force || process.argv.includes("--import") || process.env.TOURNAMENT_IMPORT === "1";

async function main() {
  const existing = await prisma.team.count();
  if (existing > 0 && !force) {
    console.log(`Seed skipped: ${existing} teams already exist. Pass --reset to wipe and reseed.`);
    return;
  }

  if (!importDraw) {
    await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
    console.log("No draw imported. Add teams in Settings, then build a bracket.");
    return;
  }

  const data = JSON.parse(readFileSync(new URL("./tournament.json", import.meta.url), "utf8"));

  await prisma.$transaction(async (tx) => {
    await tx.match.deleteMany();
    await tx.announcement.deleteMany();
    await tx.team.deleteMany();

    const teamIdBySeed = new Map();
    for (const t of data.teams) {
      const team = await tx.team.create({ data: { name: t.name, shortName: t.shortName, seed: t.seed } });
      teamIdBySeed.set(t.seed, team.id);
    }

    const slotTeams = new Map();
    data.matches.forEach((m, order) => {
      const row = {
        id: m.id,
        order,
        side: m.side,
        round: m.round,
        roundLabel: m.roundLabel,
        court: m.court ?? null,
        startsAt: m.startsAt ? new Date(m.startsAt) : null,
        status: m.status ?? "scheduled",
        teamAId: m.teamA ? teamIdBySeed.get(m.teamA) : null,
        teamBId: m.teamB ? teamIdBySeed.get(m.teamB) : null,
        winnerToId: m.winnerTo?.[0] ?? null,
        winnerToSlot: m.winnerTo?.[1] ?? null,
        loserToId: m.loserTo?.[0] ?? null,
        loserToSlot: m.loserTo?.[1] ?? null,
        isReset: Boolean(m.isReset),
      };
      if (row.status === "bye" && row.teamAId && row.winnerToId) {
        row.winnerId = row.teamAId;
        row.advanced = true;
        slotTeams.set(`${row.winnerToId}:${row.winnerToSlot}`, row.teamAId);
      }
      slotTeams.set(`row:${m.id}`, row);
    });

    for (const m of data.matches) {
      const row = slotTeams.get(`row:${m.id}`);
      row.teamAId ??= slotTeams.get(`${m.id}:A`) ?? null;
      row.teamBId ??= slotTeams.get(`${m.id}:B`) ?? null;
      await tx.match.create({ data: row });
    }

    await tx.settings.upsert({ where: { id: 1 }, update: { version: { increment: 1 } }, create: { id: 1 } });
  });

  console.log(`Seeded ${data.teams.length} teams and ${data.matches.length} matches.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
