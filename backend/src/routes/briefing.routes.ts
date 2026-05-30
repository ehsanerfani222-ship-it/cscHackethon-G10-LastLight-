import { Router, Request, Response } from 'express';
import { generateSurvivalBriefing } from '../services/briefing.service';
import { calculateThreatIndex } from '../services/threat-index.service';
import { getCrises } from '../services/crisis.service';
import { getPredictions } from '../services/ai-pipeline.service';

const router = Router();

// POST /api/briefing
router.post('/', async (req: Request, res: Response) => {
  try {
    const { lat, lng, facilities } = req.body as { lat?: number; lng?: number; facilities?: Array<{ type: string; name: string; distanceKm?: number }> };
    const crises = await getCrises();
    const predictions = getPredictions();
    const briefing = await generateSurvivalBriefing({ lat, lng, crises, predictions, facilities });
    res.json(briefing);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/briefing/threat-index
router.get('/threat-index', async (_req: Request, res: Response) => {
  try {
    const crises = await getCrises();
    const index = calculateThreatIndex(crises);
    res.json(index);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
