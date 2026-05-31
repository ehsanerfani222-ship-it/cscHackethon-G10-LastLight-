import { Router } from 'express';
import { z } from 'zod';
import type { Consultation } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  ConsultationParamsSchema,
  ConsultationUpdateSchema,
  DoctorConsultSchema,
} from '../validators/doctor.validator';
import { getAIDoctorAdvice } from '../services/ai.doctor.service';
const router = Router();

function parseList(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function serializeConsultation(consultation: Consultation) {
  return {
    ...consultation,
    immediateSteps: parseList(consultation.immediateSteps),
    doNotDo: parseList(consultation.doNotDo),
    whenToCallEmergency: parseList(consultation.whenToCallEmergency),
    recoveryTips: parseList(consultation.recoveryTips),
  };
}

function handleError(res: import('express').Response, error: unknown, fallbackMessage: string) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      detail: error.flatten(),
    });
  }

  return res.status(400).json({
    error: fallbackMessage,
    detail: error instanceof Error ? error.message : String(error),
  });
}

router.post('/consult', async (req, res) => {
  try {
    const payload = DoctorConsultSchema.parse(req.body);
    const aiResult = await getAIDoctorAdvice(payload);

    const consultation = await prisma.consultation.create({
      data: {
        category: payload.category,
        symptom: payload.symptom,
        bodyArea: payload.bodyArea,
        severity: payload.severity,
        age: payload.age,
        additionalInfo: payload.additionalInfo || null,
        urgencyLevel: aiResult.urgencyLevel,
        urgencyColor: aiResult.urgencyColor,
        headline: aiResult.headline,
        immediateSteps: JSON.stringify(aiResult.immediateSteps),
        doNotDo: JSON.stringify(aiResult.doNotDo),
        whenToCallEmergency: JSON.stringify(aiResult.whenToCallEmergency),
        recoveryTips: JSON.stringify(aiResult.recoveryTips),
        disclaimer: aiResult.disclaimer,
      },
    });

    return res.status(201).json(serializeConsultation(consultation));
  } catch (error) {
    return handleError(res, error, 'Consultation failed');
  }
});

router.get('/history', async (_req, res) => {
  const consultations = await prisma.consultation.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return res.json(consultations.map(serializeConsultation));
});

router.get('/history/:id', async (req, res) => {
  const params = ConsultationParamsSchema.parse(req.params);
  const consultation = await prisma.consultation.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!consultation) {
    return res.status(404).json({
      error: 'Consultation not found',
    });
  }

  return res.json(serializeConsultation(consultation));
});

router.put('/history/:id', async (req, res) => {
  try {
    const params = ConsultationParamsSchema.parse(req.params);
    const payload = ConsultationUpdateSchema.parse(req.body);

    const updated = await prisma.consultation.update({
      where: {
        id: params.id,
      },
      data: {
        additionalInfo: payload.additionalInfo || null,
      },
    });

    return res.json(serializeConsultation(updated));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(res, error, 'Validation failed');
    }

    return res.status(404).json({
      error: 'Consultation not found',
    });
  }
});

router.delete('/history/:id', async (req, res) => {
  try {
    const params = ConsultationParamsSchema.parse(req.params);

    await prisma.consultation.delete({
      where: {
        id: params.id,
      },
    });

    return res.json({
      success: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(res, error, 'Validation failed');
    }

    return res.status(404).json({
      error: 'Consultation not found',
    });
  }
});

export default router;
