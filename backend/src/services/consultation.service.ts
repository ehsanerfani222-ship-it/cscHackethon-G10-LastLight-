import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';
import type { DoctorInput, DoctorResponse } from './ai-doctor.service';

const adapter = new PrismaLibSql({ url: `file:${path.join(process.cwd(), 'lastlight.db')}` });
const prisma = new PrismaClient({ adapter });

type ConsultationRecord = Awaited<ReturnType<typeof prisma.consultation.findFirst>>;

function stringifyList(value: string[]) {
  return JSON.stringify(value);
}

function parseList(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function formatConsultation(record: NonNullable<ConsultationRecord>) {
  return {
    ...record,
    immediateSteps: parseList(record.immediateSteps),
    doNotDo: parseList(record.doNotDo),
    whenToCallEmergency: parseList(record.whenToCallEmergency),
    recoveryTips: parseList(record.recoveryTips),
  };
}

export async function createConsultation(input: DoctorInput, advice: DoctorResponse) {
  const consultation = await prisma.consultation.create({
    data: {
      category: input.category,
      symptom: input.symptom,
      bodyArea: input.bodyArea,
      severity: input.severity,
      age: input.age,
      additionalInfo: input.additionalInfo || null,
      urgencyLevel: advice.urgencyLevel,
      urgencyColor: advice.urgencyColor,
      headline: advice.headline,
      immediateSteps: stringifyList(advice.immediateSteps),
      doNotDo: stringifyList(advice.doNotDo),
      whenToCallEmergency: stringifyList(advice.whenToCallEmergency),
      recoveryTips: stringifyList(advice.recoveryTips),
      disclaimer: advice.disclaimer,
    },
  });

  return formatConsultation(consultation);
}

export async function getConsultations() {
  const consultations = await prisma.consultation.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return consultations.map(formatConsultation);
}

export async function getConsultation(id: string) {
  const consultation = await prisma.consultation.findUnique({ where: { id } });
  return consultation ? formatConsultation(consultation) : null;
}

export async function updateConsultation(id: string, additionalInfo?: string) {
  const consultation = await prisma.consultation.update({
    where: { id },
    data: { additionalInfo: additionalInfo || null },
  });

  return formatConsultation(consultation);
}

export async function deleteConsultation(id: string) {
  await prisma.consultation.delete({ where: { id } });
  return { deleted: true };
}
