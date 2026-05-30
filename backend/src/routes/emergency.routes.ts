import { Router, Request, Response } from 'express';
import { createBroadcast, getBroadcasts } from '../services/emergency.service';

const router = Router();

router.get('/broadcasts', async (_req: Request, res: Response) => {
  try {
    const broadcasts = await getBroadcasts();
    res.json(broadcasts);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/broadcasts', async (req: Request, res: Response) => {
  try {
    const { content, username, location, latitude, longitude } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'content is required' });
    }
    const broadcast = await createBroadcast({
      content,
      username: typeof username === 'string' ? username : 'Anonymous',
      location: typeof location === 'string' ? location : '',
      latitude: typeof latitude === 'number' ? latitude : undefined,
      longitude: typeof longitude === 'number' ? longitude : undefined,
    });
    res.status(201).json(broadcast);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
