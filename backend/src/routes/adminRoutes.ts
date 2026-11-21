import { Router } from 'express';
import * as a from '../controllers/adminController';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { uploadSingle } from '../middleware/uploadMiddleware';
import { validate } from '../utils/errors';

const router = Router();

// Every admin route requires a valid session AND the admin role (re-checked against the database).
router.use(authenticate, requireRole('admin'));

router.get('/complaints', validate(a.adminListSchema, 'query'), a.list);
router.get('/complaints/:trackingId', a.getOne);
router.patch('/complaints/:trackingId/status', validate(a.statusSchema), a.updateStatus);
router.patch('/complaints/:trackingId/department', validate(a.assignSchema), a.assign);
router.patch('/complaints/:trackingId/category', validate(a.verifySchema), a.verifyCategory);
router.post('/complaints/:trackingId/comments', validate(a.commentSchema), a.addComment);
router.post('/complaints/:trackingId/evidence', uploadSingle('evidence'), validate(a.evidenceSchema), a.uploadEvidence);

router.get('/duplicates', a.listDuplicates);
router.patch('/duplicates/:id', validate(a.duplicateReviewSchema), a.reviewDuplicate);

router.get('/workload', a.workload);
router.get('/departments', a.listDepartments);
router.post('/departments', validate(a.departmentSchema), a.createDepartment);
router.put('/departments/:id', validate(a.departmentSchema), a.updateDepartment);

export default router;
