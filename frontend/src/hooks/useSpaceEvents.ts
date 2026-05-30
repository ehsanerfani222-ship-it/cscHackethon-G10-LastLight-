import { useEffect, useState } from 'react';
import { fetchSpaceEvents } from '../services/api';
import type { SpaceEvent } from '../types/crisis';

export function useSpaceEvents() {
  const [events, setEvents] = useState<SpaceEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchSpaceEvents()
      .then((data: SpaceEvent[]) => setEvents(data))
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  return { events, loading, error };
}
