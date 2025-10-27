import express from 'express';
import { userProtect, driverProtect } from '../middleware/authMiddleware.js';
import { startMaskedCall } from '../controllers/commController.js';

const router = express.Router();

// Both user and driver can initiate masked calls for their trip
router.post('/masked_call', userProtect, startMaskedCall);
router.post('/masked_call', driverProtect, startMaskedCall);

export default router;
