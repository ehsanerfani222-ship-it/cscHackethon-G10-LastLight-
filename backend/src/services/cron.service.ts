import cron from 'node-cron';
import { runAIPipeline } from './ai-pipeline.service';

type BroadcastFn = () => void;
let broadcastFn: BroadcastFn | null = null;

export function setCronBroadcast(fn: BroadcastFn) {
  broadcastFn = fn;
}

export function startCronJobs() {
  // Every 30 minutes — run full AI pipeline scan
  cron.schedule('*/30 * * * *', async () => {
    console.log('[CRON] 30-min pipeline scan starting...');
    await runAIPipeline();
    broadcastFn?.();
  });

  // Every 6 hours — deeper analysis
  cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] 6h deep scan starting...');
    await runAIPipeline();
    broadcastFn?.();
  });

  console.log('[CRON] Scheduled: every 30 min + 6h deep scan');
}
