import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store/useStore';
import type { Crisis, PipelineState, Prediction } from '../types/crisis';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

export function usePipeline() {
  const { setCrises, setPipelineState, setPredictions, addNotification } = useStore();
  const prevIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (socket) return;
    socket = io('http://localhost:4000', { transports: ['websocket', 'polling'] });

    socket.on('connect', () => console.log('[WS] Connected to LASTLIGHT backend'));
    socket.on('disconnect', () => console.log('[WS] Disconnected'));

    socket.on('crisis:update', (data: { crises: Crisis[]; pipelineState: PipelineState; predictions: Prediction[] }) => {
      setCrises(data.crises);
      setPipelineState(data.pipelineState);
      setPredictions(data.predictions ?? []);

      // Notify about new critical crises
      const prevIds = prevIdsRef.current;
      data.crises
        .filter((c) => c.severity >= 7 && !prevIds.has(c.id))
        .forEach((c) => {
          addNotification({ id: c.id, title: c.title, severity: c.severity, crisisId: c.id });
          if (c.severity >= 9) toast.error(`🚨 CRITICAL: ${c.title}`, { duration: 6000 });
        });
      prevIdsRef.current = new Set(data.crises.map((c) => c.id));
    });

    socket.on('pipeline:status', (pipelineState: PipelineState) => {
      setPipelineState(pipelineState);
      if (pipelineState.status === 'analyzing') {
        toast('🤖 AI scanning global data sources...', {
          id: 'pipeline',
          duration: 999999,
          style: { background: '#0a1a2e', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.3)' },
        });
      }
      if (pipelineState.status === 'done') {
        toast.dismiss('pipeline');
        toast.success(`✅ AI scan complete — ${pipelineState.crisisCount} crises identified`, {
          style: { background: '#0a1a2e', color: '#2EF2A3', border: '1px solid rgba(46,242,163,0.3)' },
        });
      }
      if (pipelineState.status === 'error') {
        toast.dismiss('pipeline');
      }
    });

    return () => { socket?.disconnect(); socket = null; };
  }, []);
}
