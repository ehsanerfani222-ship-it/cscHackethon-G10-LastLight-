import { Router, Request, Response } from 'express';
import { fetchCountryNews, fetchLocationNews, fetchCrisisTypeNews, fetchGeneralCrisisNews } from '../services/news.service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const location = String(req.query.location ?? '');
    const country = String(req.query.country ?? '');
    const type = String(req.query.type ?? '');
    const countryCode = String(req.query.countryCode ?? '');
    const city = String(req.query.city ?? '');

    let news;
    if (country && (countryCode || city)) {
      news = await fetchCountryNews(country, countryCode, type || undefined, city || undefined);
    } else if (location && type) {
      news = await fetchCrisisTypeNews(type, location);
    } else if (location) {
      news = await fetchLocationNews(location, country);
    } else {
      news = await fetchGeneralCrisisNews();
    }

    res.json(news);
  } catch (err) {
    console.error('[News]', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

export default router;
