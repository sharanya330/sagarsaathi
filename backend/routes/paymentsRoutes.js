import express from 'express';
import { driverProtect } from '../middleware/authMiddleware.js';
import { createLeadFeeSession, confirmLeadFee } from '../controllers/paymentsController.js';

const router = express.Router();

router.post('/lead_fee/create_session', driverProtect, createLeadFeeSession);
router.get('/lead_fee/confirm', driverProtect, confirmLeadFee);

export default router;