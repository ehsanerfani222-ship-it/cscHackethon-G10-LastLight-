-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "symptom" TEXT NOT NULL,
    "bodyArea" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "age" INTEGER NOT NULL,
    "additionalInfo" TEXT,
    "urgencyLevel" TEXT NOT NULL,
    "urgencyColor" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "immediateSteps" TEXT NOT NULL,
    "doNotDo" TEXT NOT NULL,
    "whenToCallEmergency" TEXT NOT NULL,
    "recoveryTips" TEXT NOT NULL,
    "disclaimer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
