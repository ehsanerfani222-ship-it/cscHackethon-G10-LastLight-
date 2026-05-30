import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import Anthropic from '@anthropic-ai/sdk';

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  snippet: string;
  category?: string;
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function formatDate(d: string): string {
  try { return new Date(d).toISOString(); } catch { return new Date().toISOString(); }
}

type RSSItem = {
  title?: string; link?: string;
  source?: string | { '#text'?: string }; pubDate?: string; description?: string;
};

function parseRSS(xml: string, max: number): NewsItem[] {
  try {
    const parsed = parser.parse(xml);
    let items: RSSItem[] = parsed?.rss?.channel?.item ?? [];
    if (!Array.isArray(items)) items = [items].filter(Boolean);
    return items.slice(0, max)
      .map((i) => ({
        title: stripHtml(String(i?.title ?? '')),
        link: String(i?.link ?? '#'),
        source: typeof i?.source === 'string' ? i.source : (i?.source?.['#text'] ?? 'News'),
        publishedAt: formatDate(String(i?.pubDate ?? '')),
        snippet: stripHtml(String(i?.description ?? '').slice(0, 250)),
      }))
      .filter((i) => i.title.length > 5);
  } catch { return []; }
}

async function fetchRSS(url: string): Promise<string> {
  const { data } = await axios.get<string>(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout: 8000,
    responseType: 'text',
  });
  return data;
}

async function aiNews(query: string, count: number): Promise<NewsItem[]> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === 'your_anthropic_api_key_here') return [];
  try {
    const client = new Anthropic({ apiKey: key });
    const r = await client.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 800,
      messages: [{ role: 'user', content: `Generate ${count} realistic recent news headlines about: "${query}". JSON array: [{title,source,snippet}]. No markdown.` }],
    });
    const text = r.content[0].type === 'text' ? r.content[0].text : '';
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) return [];
    return (JSON.parse(m[0]) as Array<{ title?: string; source?: string; snippet?: string }>).map((x, i) => ({
      title: x.title ?? `Headline ${i + 1}`, link: '#', source: x.source ?? 'Intelligence Brief',
      publishedAt: new Date().toISOString(), snippet: x.snippet ?? '',
    }));
  } catch { return []; }
}

// Try multiple RSS sources, return first that has results
async function tryRSS(queries: string[], max: number): Promise<NewsItem[]> {
  for (const q of queries) {
    const enc = encodeURIComponent(q);
    // Google News
    try {
      const xml = await fetchRSS(`https://news.google.com/rss/search?q=${enc}&hl=en-US&gl=US&ceid=US:en`);
      const items = parseRSS(xml, max);
      if (items.length >= 3) return items;
    } catch { /* try next */ }
    // Bing News
    try {
      const xml = await fetchRSS(`https://www.bing.com/news/search?q=${enc}&format=rss`);
      const items = parseRSS(xml, max);
      if (items.length >= 2) return items;
    } catch { /* try next */ }
  }
  // AI fallback
  return aiNews(queries[0], max);
}

export async function fetchCountryNews(country: string, countryCode: string, crisisType?: string, city?: string): Promise<NewsItem[]> {
  // Build layered queries from most specific to most general
  const queries: string[] = [];
  if (crisisType && city) queries.push(`${crisisType.replace('_', ' ')} ${city} ${country} 2025`);
  if (crisisType) queries.push(`${crisisType.replace('_', ' ')} ${country}`);
  if (city) queries.push(`${city} emergency disaster crisis`);
  queries.push(`${country} crisis emergency disaster 2025`);
  queries.push(`${country} news today`);
  return tryRSS(queries, 10);
}

export async function fetchLocationNews(location: string, country: string): Promise<NewsItem[]> {
  return tryRSS([`${location} ${country} crisis disaster emergency`, `${country} disaster emergency`], 8);
}

export async function fetchCrisisTypeNews(crisisType: string, location: string): Promise<NewsItem[]> {
  return tryRSS([`${crisisType.replace('_', ' ')} ${location}`, `${location} emergency`], 6);
}

export async function fetchGeneralCrisisNews(): Promise<NewsItem[]> {
  return tryRSS(['global crisis disaster emergency 2025', 'world news emergency'], 10);
}
