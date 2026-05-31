import { Router } from 'express';
import { listCrises, getCrisis, generateCrises } from '../controllers/crisis.controller';

const router = Router();

router.get('/', listCrises);
router.get('/:id', getCrisis);
router.post('/generate', generateCrises);

export default router;
