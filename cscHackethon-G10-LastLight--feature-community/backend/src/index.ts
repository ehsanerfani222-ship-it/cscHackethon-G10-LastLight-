import 'dotenv/config';
import http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { Server as SocketIO } from 'socket.io';
import crisisRoutes from './routes/crisis.routes';
import facilitiesRoutes from './routes/facilities.routes';
import newsRoutes from './routes/news.routes';
import spaceRoutes from './routes/space.routes';
import settingsRoutes from './routes/settings.routes';
import briefingRoutes from './routes/briefing.routes';
import communityRoutes from './modules/community/routes';
import { getCrises } from './services/crisis.service';
import { startCronJobs, setCronBroadcast } from './services/cron.service';
import { seedDatabase, isTodayEmpty } from './services/seed.service';
import { runAIPipeline, getPipelineState, getPredictions, setPipelineUpdateCallback } from './services/ai-pipeline.service';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ?? 4000;

const io = new SocketIO(server, {
  cors: { origin: ['http://localhost:5173', 'http://localhost:4173'], methods: ['GET', 'POST'] },
});

async function broadcastUpdate() {
  const [crises, pipelineState, predictions] = await Promise.all([
    getCrises(),
    Promise.resolve(getPipelineState()),
    Promise.resolve(getPredictions()),
  ]);
  io.emit('crisis:update', { crises, pipelineState, predictions });
}

setPipelineUpdateCallback((pipelineState) => {
  io.emit('pipeline:status', pipelineState);
  if (pipelineState.status === 'done') broadcastUpdate();
});

setCronBroadcast(() => broadcastUpdate());

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  Promise.all([getCrises(), Promise.resolve(getPipelineState()), Promise.resolve(getPredictions())])
    .then(([crises, pipelineState, predictions]) => {
      socket.emit('crisis:update', { crises, pipelineState, predictions });
    });
  socket.on('disconnect', () => console.log(`[WS] Client disconnected: ${socket.id}`));
});

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '5mb' }));

app.use('/api/crises', crisisRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/space', spaceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/briefing', briefingRoutes);

app.get('/api/pipeline/status', (_req: Request, res: Response) => res.json(getPipelineState()));
app.get('/api/pipeline/predictions', (_req: Request, res: Response) => res.json(getPredictions()));

app.post('/api/pipeline/scan', async (_req: Request, res: Response) => {
  if (getPipelineState().status === 'fetching' || getPipelineState().status === 'analyzing') {
    return res.json({ message: 'Scan already in progress', status: getPipelineState().status });
  }

  runAIPipeline().then(() => broadcastUpdate());
  res.json({ message: 'AI scan started', status: 'scanning' });
});

app.post('/api/seed', async (_req: Request, res: Response) => {
  try {
    const count = await seedDatabase();
    await broadcastUpdate();
    res.json({ message: `Seeded ${count} crisis events`, count });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/health', (_req: Request, res: Response) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), pipeline: getPipelineState().status })
);

server.listen(PORT, async () => {
  console.log(`LASTLIGHT API + WebSocket on http://localhost:${PORT}`);
  startCronJobs();

  const hasKey = !!process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here';

  if (hasKey) {
    console.log('Running initial AI pipeline scan...');
    await runAIPipeline();
    broadcastUpdate();
  } else {
    console.log('No API key - loading real earthquake data + seed crises');
    const empty = await isTodayEmpty();
    if (empty) await seedDatabase();
    await runAIPipeline();
    broadcastUpdate();
  }
});
