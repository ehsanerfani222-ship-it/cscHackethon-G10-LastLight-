import { Router } from 'express';
import facilitiesRouter from './routes/facilities.routes';
import safeZonesRouter from './modules/ossma/routers/safezones.router';

const router = Router();

router.use('/facilities', facilitiesRouter);
router.use('/safezones', safeZonesRouter);

export default router;
