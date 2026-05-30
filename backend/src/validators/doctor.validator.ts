import { z } from 'zod';

export const DoctorConsultSchema = z.object({
  category: z.string().trim().min(1),
  symptom: z.string().trim().min(1),
  bodyArea: z.string().trim().min(1),
  severity: z.coerce.number().int().min(1).max(5),
  age: z.coerce.number().int().min(1).max(120),
  additionalInfo: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const ConsultationUpdateSchema = z.object({
  additionalInfo: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const ConsultationParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export type DoctorConsultInput = z.infer<typeof DoctorConsultSchema>;
