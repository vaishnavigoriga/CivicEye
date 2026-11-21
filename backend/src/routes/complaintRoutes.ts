import { Router } from 'express';
import * as c from '../controllers/complaintController';
import { authenticate, optionalAuth } from '../middleware/authMiddleware';
import { aiLimiter, submitLimiter } from '../middleware/rateLimit';
import { uploadFields } from '../middleware/uploadMiddleware';
import { validate } from '../utils/errors';

const router = Router();

// Static paths first, then the dynamic :trackingId routes.
router.get('/', validate(c.listSchema, 'query'), c.list);
router.get('/map', validate(c.mapSchema, 'query'), c.mapPoints);
router.get('/analytics', validate(c.analyticsSchema, 'query'), c.analytics);
router.get('/mine', authenticate, c.mine);
router.post('/check-duplicates', authenticate, aiLimiter, validate(c.duplicateCheckSchema), c.checkDuplicates);
router.post(
  '/',
  authenticate,
  submitLimiter,
  uploadFields([{ name: 'image', kind: 'image' }, { name: 'audio', kind: 'audio' }]),
  validate(c.submitSchema),
  c.submit,
);
router.get('/:trackingId', optionalAuth, c.getOne);
router.post('/:trackingId/translate', optionalAuth, aiLimiter, validate(c.translateSchema), c.translateComplaint);
router.post('/:trackingId/support', authenticate, c.addSupport);
router.delete('/:trackingId/support', authenticate, c.removeSupport);

export default router;
