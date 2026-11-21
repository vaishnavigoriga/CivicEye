import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

// Router-level protection: All admin routes strictly require valid JWT and 'admin' role
router.use(authenticate, requireRole('admin'));

/**
 * EXACT ROUTE REGISTRATION ORDER: Static before dynamic
 */
router.get('/kpis', AdminController.getKPIs);
router.get('/audit', AdminController.getAuditLog);
router.get('/complaints', AdminController.getAllComplaints);
router.get('/duplicates', AdminController.getDuplicateGroups);
router.get('/departments', AdminController.getDepartments);
router.post('/departments', AdminController.createDepartment);
router.put('/departments/:id', AdminController.updateDepartment);

// Dynamic routes
router.get('/complaints/:id', AdminController.getAllComplaints); // or single complaint if needed
router.patch('/complaints/:id/status', AdminController.updateStatus);
router.patch('/complaints/:id/department', AdminController.assignDepartment);
router.post('/complaints/:id/evidence', upload.single('evidence'), AdminController.uploadEvidence);
router.patch('/complaints/:id/duplicate', AdminController.reviewDuplicate);

export default router;
