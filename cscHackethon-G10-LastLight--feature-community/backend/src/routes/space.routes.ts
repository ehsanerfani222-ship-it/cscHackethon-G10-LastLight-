import { Router, Request, Response } from 'express';
import { getSpaceEvents, generateFreshEvents } from '../services/space-events.service';

const router = Router();

// GET /api/space/events?planet=mars
router.get('/events', async (req: Request, res: Response) => {
  try {
    const planet = typeof req.query.planet === 'string' ? req.query.planet : undefined;
    const events = await getSpaceEvents(planet);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/space/generate
router.post('/generate', async (_req: Request, res: Response) => {
  try {
    const events = await generateFreshEvents();
    res.json({ count: events.length, events });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
