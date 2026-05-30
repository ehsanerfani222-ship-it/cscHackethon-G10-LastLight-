import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

// POST /api/settings/apikey
router.post('/apikey', (req: Request, res: Response) => {
  const { apiKey } = req.body as { apiKey?: string };
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    res.status(400).json({ error: 'Invalid API key format' });
    return;
  }
  process.env.ANTHROPIC_API_KEY = apiKey.trim();
  res.json({ success: true, message: 'API key stored in memory' });
});

// GET /api/settings/status
router.get('/status', async (_req: Request, res: Response) => {
  const key = process.env.ANTHROPIC_API_KEY;
  const hasApiKey = !!key && key !== 'your_anthropic_api_key_here' && key.length > 10;

  if (!hasApiKey) {
    res.json({ hasApiKey: false, isValid: false });
    return;
  }

  // Quick validation call
  try {
    const client = new Anthropic({ apiKey: key });
    await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });
    res.json({ hasApiKey: true, isValid: true });
  } catch {
    res.json({ hasApiKey: true, isValid: false });
  }
});

export default router;
