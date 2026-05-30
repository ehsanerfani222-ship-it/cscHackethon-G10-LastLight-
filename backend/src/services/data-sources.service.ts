/**
 * Aggregates real-time data from global monitoring systems.
 * All sources are free and require no API keys.
 */
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ ignoreAttributes: false });

const http = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'LASTLIGHT-CrisisAI/1.0 (emergency-intelligence-platform)',
    Accept: 'application/json, application/xml, text/xml, */*',
  },
});

export interface RawDataBundle {
  earthquakes: string;
  solarEvents: string;
  disasters: string;
  humanitarian: string;
  newsHeadlines: string;
  fetchedAt: string;
}

// ── USGS Earthquakes (M2.5+ last 24h) ──────────────────────────────────────
async function fetchEarthquakes(): Promise<string> {
  try {
    const { data } = await http.get(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'
    );
    const quakes = data.features
      .filter((f: { properties: { mag: number } }) => f.properties.mag >= 4.0)
      .slice(0, 15)
      .map((f: {
        properties: { mag: number; place: string; time: number; status: string; tsunami: number; alert?: string };
        geometry: { coordinates: [number, number, number] };
      }) => ({
        magnitude: f.properties.mag,
        location: f.properties.place,
        time: new Date(f.properties.time).toISOString(),
        depth_km: f.geometry.coordinates[2],
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        tsunami_alert: f.properties.tsunami === 1,
        alert: f.properties.alert,
      }));
    return JSON.stringify(quakes, null, 2);
  } catch {
    return '[]';
  }
}

// ── NASA DONKI Solar Events ────────────────────────────────────────────────
async function fetchSolarEvents(): Promise<string> {
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  try {
    const [flares, cme] = await Promise.allSettled([
      http.get(`https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR?startDate=${start}&endDate=${end}`),
      http.get(`https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/CME?startDate=${start}&endDate=${end}`),
    ]);
    const summary: object[] = [];
    if (flares.status === 'fulfilled') {
      (flares.value.data as Array<{ classType?: string; beginTime?: string; sourceLocation?: string }>)
        .slice(0, 8)
        .forEach((f) => summary.push({ type: 'solar_flare', class: f.classType, time: f.beginTime, location: f.sourceLocation }));
    }
    if (cme.status === 'fulfilled') {
      (cme.value.data as Array<{ activityID?: string; startTime?: string; note?: string }>)
        .slice(0, 5)
        .forEach((c) => summary.push({ type: 'cme', id: c.activityID, time: c.startTime, note: c.note }));
    }
    return JSON.stringify(summary, null, 2);
  } catch {
    return '[]';
  }
}

// ── GDACS Global Disaster Alerts (RSS) ────────────────────────────────────
async function fetchGDACS(): Promise<string> {
  try {
    const { data } = await http.get('https://www.gdacs.org/xml/rss.xml', { responseType: 'text' });
    const parsed = parser.parse(data as string);
    const items: Array<{
      title?: string; description?: string; pubDate?: string;
      'gdacs:alertlevel'?: string; 'gdacs:country'?: string;
      'gdacs:todate'?: string; 'gdacs:iso3'?: string;
    }> = parsed?.rss?.channel?.item ?? [];
    const alerts = Array.isArray(items) ? items.slice(0, 12).map((i) => ({
      title: i.title,
      description: typeof i.description === 'string' ? i.description.replace(/<[^>]*>/g, '').trim().slice(0, 200) : '',
      date: i.pubDate,
      alert_level: i['gdacs:alertlevel'],
      country: i['gdacs:country'],
    })) : [];
    return JSON.stringify(alerts, null, 2);
  } catch {
    return '[]';
  }
}

// ── ReliefWeb Humanitarian Crises ─────────────────────────────────────────
async function fetchReliefWeb(): Promise<string> {
  try {
    const { data } = await http.post(
      'https://api.reliefweb.int/v1/disasters?appname=lastlight&limit=15',
      { fields: { include: ['name', 'date', 'status', 'country', 'primary_type', 'url'] } }
    );
    const disasters = (data.data as Array<{
      fields: { name?: string; date?: { event?: string }; status?: string; country?: Array<{ name?: string }>; primary_type?: { name?: string } }
    }>).map((d) => ({
      name: d.fields.name,
      date: d.fields.date?.event,
      status: d.fields.status,
      country: d.fields.country?.[0]?.name,
      type: d.fields.primary_type?.name,
    }));
    return JSON.stringify(disasters, null, 2);
  } catch {
    return '[]';
  }
}

// ── Crisis News Headlines (Google News RSS) ───────────────────────────────
async function fetchCrisisNews(): Promise<string> {
  const queries = ['global disaster emergency 2025', 'earthquake flood pandemic crisis'];
  const headlines: string[] = [];
  for (const q of queries) {
    try {
      const { data } = await http.get(
        `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`,
        { responseType: 'text' }
      );
      const parsed = parser.parse(data as string);
      const items: Array<{ title?: string }> = parsed?.rss?.channel?.item ?? [];
      if (Array.isArray(items)) {
        items.slice(0, 8).forEach((i) => {
          if (i.title) headlines.push(String(i.title).replace(/<[^>]*>/g, '').trim());
        });
      }
    } catch { /* continue */ }
  }
  return headlines.slice(0, 15).join('\n');
}

// ── Main aggregator ────────────────────────────────────────────────────────
export async function aggregateAllSources(): Promise<RawDataBundle> {
  console.log('[DataSources] Fetching from all real-time sources...');
  const [earthquakes, solarEvents, disasters, humanitarian, newsHeadlines] = await Promise.allSettled([
    fetchEarthquakes(),
    fetchSolarEvents(),
    fetchGDACS(),
    fetchReliefWeb(),
    fetchCrisisNews(),
  ]);

  const bundle: RawDataBundle = {
    earthquakes: earthquakes.status === 'fulfilled' ? earthquakes.value : '[]',
    solarEvents: solarEvents.status === 'fulfilled' ? solarEvents.value : '[]',
    disasters: disasters.status === 'fulfilled' ? disasters.value : '[]',
    humanitarian: humanitarian.status === 'fulfilled' ? humanitarian.value : '[]',
    newsHeadlines: newsHeadlines.status === 'fulfilled' ? newsHeadlines.value : '',
    fetchedAt: new Date().toISOString(),
  };

  console.log(`[DataSources] Bundle ready (${new Date().toISOString()})`);
  return bundle;
}
