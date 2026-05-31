import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';
import { SEED_CRISES } from '../data/seedCrises';

const adapter = new PrismaLibSql({ url: `file:${path.join(process.cwd(), 'lastlight.db')}` });
const prisma = new PrismaClient({ adapter });

function dateWindowEndingAt(dateLabel: string, days: number): string[] {
  const end = new Date(`${dateLabel}T00:00:00.000Z`);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (days - 1 - index));
    return date.toISOString().split('T')[0];
  });
}

function clampSeverity(value: number) {
  return Math.max(3.8, Math.min(9.8, Number(value.toFixed(1))));
}

export async function seedDatabase(dateLabel?: string): Promise<number> {
  const label = dateLabel ?? new Date().toISOString().split('T')[0];
  const labels = dateLabel ? [label] : dateWindowEndingAt(label, 7);
  const rows = labels.flatMap((currentLabel, dateIndex) => {
    const daysAgo = labels.length - 1 - dateIndex;
    const timestamp = new Date(`${currentLabel}T12:00:00.000Z`);
    return SEED_CRISES.map((c, crisisIndex) => {
      const wave = Math.sin((crisisIndex + 1) * (daysAgo + 1)) * 0.35;
      const agingRelief = daysAgo * 0.08;
      const severity = clampSeverity(c.severity + wave - agingRelief);
      const populationFactor = 1 + (Math.cos((crisisIndex + 2) * (daysAgo + 1)) * 0.08) - (daysAgo * 0.015);

      return {
        ...c,
        severity,
        affectedPopulation: Math.max(5000, Math.round(c.affectedPopulation * populationFactor)),
        status: daysAgo >= 5 && severity < 6.2 ? 'monitoring' : c.status,
        safetyProtocols: JSON.stringify(c.safetyProtocols),
        scientificData: JSON.stringify(c.scientificData),
        predictionScore: Number(Math.min(0.95, 0.35 + severity / 20).toFixed(2)),
        predictionNote: daysAgo === 0 ? 'Ongoing monitoring required' : `Historical test snapshot from ${currentLabel}`,
        dateLabel: currentLabel,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    });
  });

  await prisma.crisis.deleteMany({ where: { dateLabel: { in: labels } } });
  await prisma.crisis.createMany({
    data: rows,
  });
  return rows.length;
}

export async function isTodayEmpty(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const count = await prisma.crisis.count({ where: { dateLabel: today } });
  return count === 0;
}
