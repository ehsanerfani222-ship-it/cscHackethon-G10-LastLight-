import { Router, Request, Response } from 'express';
import { getAIDoctorAdvice } from '../services/ai-doctor.service';

const router = Router();

router.post('/consult', async (req: Request, res: Response) => {
  try {
    const result = await getAIDoctorAdvice(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'AI Doctor failed', detail: String(err) });
  }
});

export default router;
