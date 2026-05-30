import { z } from 'zod';

export const DoctorConsultSchema = z.object({
  category: z.string().min(1),
  symptom: z.string().min(1),
  bodyArea: z.string().min(1),
  severity: z.number().int().min(1).max(5),
  age: z.number().int().min(1).max(120),
  additionalInfo: z.string().optional(),
});

export const ConsultationParamsSchema = z.object({
  id: z.string().uuid(),
});

export const ConsultationUpdateSchema = z.object({
  additionalInfo: z.string().optional(),
});
