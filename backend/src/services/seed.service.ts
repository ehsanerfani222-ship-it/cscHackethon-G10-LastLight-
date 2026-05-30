import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';
import { SEED_CRISES } from '../data/seedCrises';

const adapter = new PrismaLibSql({ url: `file:${path.join(process.cwd(), 'lastlight.db')}` });
const prisma = new PrismaClient({ adapter });

export async function seedDatabase(dateLabel?: string): Promise<number> {
  const label = dateLabel ?? new Date().toISOString().split('T')[0];
  await prisma.crisis.deleteMany({ where: { dateLabel: label } });
  await prisma.crisis.createMany({
    data: SEED_CRISES.map((c) => ({
      ...c,
      safetyProtocols: JSON.stringify(c.safetyProtocols),
      scientificData: JSON.stringify(c.scientificData),
      predictionScore: 0.4,
      predictionNote: 'Ongoing monitoring required',
      dateLabel: label,
    })),
  });
  return SEED_CRISES.length;
}

export async function isTodayEmpty(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const count = await prisma.crisis.count({ where: { dateLabel: today } });
  return count === 0;
}
