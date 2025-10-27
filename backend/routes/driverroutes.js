import express from 'express';
import { driverProtect, userProtect } from '../middleware/authMiddleware.js';
import { registerDriver, loginDriver, uploadDocument, uploadMultipleDocuments, updateVerification, getDriverProfile, sendDriverOtp, verifyDriverOtp } from '../controllers/driverController.js';
import { 
    updateDriverLocation, 
    findNearestDrivers, 
    getLiveDriverLocations,
    setDriverAvailability,
    getDriverAvailability
} from '../controllers/logisticsController.js';
import { uploadSingle, uploadDriverDocuments } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// @desc    Register a new driver
// @route   POST /api/drivers/register
// @access  Public
router.post('/register', registerDriver);

// @desc    Authenticate driver & get token
// @route   POST /api/drivers/login
// @access  Public
router.post('/login', loginDriver);

// @desc    Send OTP to driver phone
// @route   POST /api/drivers/otp/send
// @access  Public
router.post('/otp/send', sendDriverOtp);

// @desc    Verify OTP and login
// @route   POST /api/drivers/otp/verify
// @access  Public
router.post('/otp/verify', verifyDriverOtp);

// @desc    Get current driver profile
// @route   GET /api/drivers/me
// @access  Private (Driver)
router.get('/me', driverProtect, getDriverProfile);

// @desc    Upload single document (Vetting Phase 1)
// @route   POST /api/drivers/upload_doc
// @access  Private (Driver only)
router.post('/upload_doc', driverProtect, uploadSingle, uploadDocument);

// @desc    Upload multiple documents at once
// @route   POST /api/drivers/upload_documents
// @access  Private (Driver only)
router.post('/upload_documents', driverProtect, uploadDriverDocuments, uploadMultipleDocuments);

// @desc    Admin/System updates driver verification status (Vetting Phase 2)
// @route   PUT /api/drivers/update_verification
// @access  Private/Admin (Should be protected by an isAdmin middleware)
router.put('/update_verification', driverProtect, updateVerification);

// @desc    Driver sends continuous location updates (Real-Time Phase)
// @route   PUT /api/drivers/location
// @access  Private (Driver only)
router.put('/location', driverProtect, updateDriverLocation);

// @desc    Search for nearby available drivers (Logistics Phase)
// @route   GET /api/drivers/search
// @access  Private (User only)
router.get('/search', userProtect, findNearestDrivers);

// @desc    Get live locations of all active drivers (Admin only)
// @route   GET /api/drivers/live-locations
// @access  Private (Admin)
router.get('/live-locations', driverProtect, getLiveDriverLocations);

// @desc    Set driver availability range
// @route   POST /api/drivers/availability
// @access  Private (Driver)
router.post('/availability', driverProtect, setDriverAvailability);

// @desc    Get driver availability calendar
// @route   GET /api/drivers/availability/:driverId
// @access  Public
router.get('/availability/:driverId', getDriverAvailability);

export default router;
