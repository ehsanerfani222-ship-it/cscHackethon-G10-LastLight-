import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  createConsultation,
  deleteConsultation,
  getConsultation,
  getConsultations,
  updateConsultation,
} from '../services/consultation.service';
import { getAIDoctorAdvice } from '../services/ai-doctor.service';
import {
  ConsultationParamsSchema,
  ConsultationUpdateSchema,
  DoctorConsultSchema,
} from '../validators/doctor.validator';

const router = Router();

function sendError(res: Response, err: unknown, status = 500) {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: 'Validation failed', issues: err.issues });
  }

  return res.status(status).json({ error: String(err) });
}

router.post('/consult', async (req: Request, res: Response) => {
  try {
    const payload = DoctorConsultSchema.parse(req.body);
    const advice = await getAIDoctorAdvice(payload);
    const consultation = await createConsultation(payload, advice);
    res.status(201).json(consultation);
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/history', async (_req: Request, res: Response) => {
  try {
    const consultations = await getConsultations();
    res.json(consultations);
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/history/:id', async (req: Request, res: Response) => {
  try {
    const { id } = ConsultationParamsSchema.parse(req.params);
    const consultation = await getConsultation(id);
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });
    res.json(consultation);
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/history/:id', async (req: Request, res: Response) => {
  try {
    const { id } = ConsultationParamsSchema.parse(req.params);
    const payload = ConsultationUpdateSchema.parse(req.body);
    const consultation = await updateConsultation(id, payload.additionalInfo);
    res.json(consultation);
  } catch (err) {
    sendError(res, err, 404);
  }
});

router.delete('/history/:id', async (req: Request, res: Response) => {
  try {
    const { id } = ConsultationParamsSchema.parse(req.params);
    const result = await deleteConsultation(id);
    res.json(result);
  } catch (err) {
    sendError(res, err, 404);
  }
});

export default router;
