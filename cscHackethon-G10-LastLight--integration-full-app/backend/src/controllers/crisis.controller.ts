import type { Request, Response } from 'express';
import { getCrises, getCrisisById, generateAndStoreCrises } from '../services/crisis.service';

export async function listCrises(req: Request, res: Response) {
  try {
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    const crises = await getCrises(date);
    res.json(crises);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch crises' });
  }
}

export async function getCrisis(req: Request, res: Response) {
  try {
    const crisis = await getCrisisById(String(req.params.id));
    if (!crisis) return res.status(404).json({ error: 'Crisis not found' });
    res.json(crisis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch crisis' });
  }
}

export async function generateCrises(req: Request, res: Response) {
  try {
    const date = typeof req.body?.date === 'string' ? req.body.date : undefined;
    const count = await generateAndStoreCrises(date);
    res.json({ message: 'Crises generated successfully', count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI generation failed', detail: String(err) });
  }
}
