-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "roundLabel" TEXT NOT NULL,
    "court" TEXT,
    "startsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "teamAId" INTEGER,
    "teamBId" INTEGER,
    "sets" JSONB NOT NULL DEFAULT '[]',
    "pointsA" INTEGER NOT NULL DEFAULT 0,
    "pointsB" INTEGER NOT NULL DEFAULT 0,
    "winnerId" INTEGER,
    "advanced" BOOLEAN NOT NULL DEFAULT false,
    "winnerToId" TEXT,
    "winnerToSlot" TEXT,
    "loserToId" TEXT,
    "loserToSlot" TEXT,
    "isReset" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" SERIAL NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "setsToWin" INTEGER NOT NULL DEFAULT 2,
    "setTarget" INTEGER NOT NULL DEFAULT 25,
    "decidingTarget" INTEGER NOT NULL DEFAULT 15,
    "winBy" INTEGER NOT NULL DEFAULT 2,
    "cap" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
