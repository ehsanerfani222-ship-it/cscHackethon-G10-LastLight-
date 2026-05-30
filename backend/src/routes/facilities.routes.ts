import { Router, Request, Response } from 'express';
import { getNearbyFacilities } from '../services/facilities.service';

const router = Router();

router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(String(req.query.lat));
    const lng = parseFloat(String(req.query.lng));
    const radius = parseInt(String(req.query.radius ?? '10000'));
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' });
    const facilities = await getNearbyFacilities(lat, lng, radius);
    res.json(facilities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch facilities', detail: String(err) });
  }
});

export default router;
