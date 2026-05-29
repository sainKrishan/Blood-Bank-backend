import express from 'express';
import { addBloodSample, getAllSamples } from '../controllers/bloodController.js';
import { requestBloodSample, getHospitalRequests, updateRequestStatus } from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Inventory Routes
router.post('/add', protect(['hospital']), addBloodSample);
router.get('/all', getAllSamples); 

// Request Routes
router.post('/request', protect(['receiver']), requestBloodSample);
router.get('/requests', protect(['hospital']), getHospitalRequests);
router.put('/requests/:id', protect(['hospital']), updateRequestStatus);

export default router;