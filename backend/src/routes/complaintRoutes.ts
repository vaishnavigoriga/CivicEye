import { Router } from 'express';
import { ComplaintController } from '../controllers/complaintController';
import { authenticate } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

/**
 * EXACT STATIC-BEFORE-DYNAMIC ROUTE ORDER:
 * 1. POST /analyze-image (AI image pre-analysis)
 * 2. POST / (submit complaint)
 * 3. GET / (list complaints)
 * 4. GET /map (Leaflet map features)
 * 5. GET /analytics/summary (Recharts dashboard data)
 * 6. GET /citizen/my (My complaints)
 * 7. POST /:id/upvote
 * 8. GET /:id (Single complaint by ObjectId or referenceId)
 */

router.post('/analyze-image', authenticate, upload.single('image'), ComplaintController.analyzeImage);
router.post('/', authenticate, upload.any(), ComplaintController.submitComplaint);
router.get('/', ComplaintController.getComplaints);
router.get('/map', ComplaintController.getMapData);
router.get('/analytics/summary', ComplaintController.getAnalyticsSummary);
router.get('/citizen/my', authenticate, ComplaintController.getMyComplaints);
router.post('/:id/upvote', authenticate, ComplaintController.toggleUpvote);
router.get('/:id', ComplaintController.getComplaintById);

export default router;
