import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import emergencyRoutes from './routes/emergency.routes';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/emergency', emergencyRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', feature: 'Emergency Communication', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚨 LASTLIGHT Emergency Communication API on http://localhost:${PORT}`);
});
