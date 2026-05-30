import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';
import { runAIPipeline } from './ai-pipeline.service';

const adapter = new PrismaLibSql({ url: `file:${path.join(process.cwd(), 'lastlight.db')}` });
const prisma = new PrismaClient({ adapter });

type RawCrisis = {
  id: string; type: string; title: string; location: string; country: string;
  lat: number; lng: number; severity: number; affectedPopulation: number;
  description: string; aiAnalysis: string; safetyProtocols: string;
  scientificData: string; status: string; dateLabel: string;
  predictionScore: number; predictionNote: string;
  createdAt: Date; updatedAt: Date;
};

function mapCrisis(c: RawCrisis) {
  return {
    ...c,
    safetyProtocols: JSON.parse(c.safetyProtocols) as string[],
    scientificData: JSON.parse(c.scientificData) as Record<string, string>,
  };
}

export async function getCrises(date?: string) {
  const today = new Date().toISOString().split('T')[0];
  const dateLabel = date ?? today;
  const crises = await prisma.crisis.findMany({
    where: { dateLabel },
    orderBy: { severity: 'desc' },
  });
  return crises.map(mapCrisis);
}

export async function getCrisisById(id: string) {
  const crisis = await prisma.crisis.findUnique({ where: { id } });
  if (!crisis) return null;
  return mapCrisis(crisis);
}

export async function generateAndStoreCrises(date?: string): Promise<number> {
  return runAIPipeline(date);
}

export async function ensureTodayHasCrises(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const count = await prisma.crisis.count({ where: { dateLabel: today } });
  if (count === 0) {
    await runAIPipeline(today);
  }
}
