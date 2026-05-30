-- CreateTable
CREATE TABLE "Crisis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "severity" REAL NOT NULL,
    "affectedPopulation" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "aiAnalysis" TEXT NOT NULL,
    "safetyProtocols" TEXT NOT NULL,
    "scientificData" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "dateLabel" TEXT NOT NULL,
    "predictionScore" REAL NOT NULL DEFAULT 0,
    "predictionNote" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
