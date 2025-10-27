import express from 'express';
import { userProtect, driverProtect } from '../middleware/authMiddleware.js';
import { 
    createTrip, 
    cancelTrip, 
    getTripStatus, 
    getMyTrips, 
    getAssignedTrips, 
    getRequestedTrips,
    acceptTrip,
    startTrip,
    endTrip,
    driverCancelTrip,
    triggerSOS,
    getLastLocation,
    generateShareToken,
    getPublicLastLocation,
    createLeadFeeCheckout,
    markLeadFeePaidDev,
    getTripContactForDriver
} from '../controllers/tripController.js';
import { getLiveTrips } from '../controllers/logisticsController.js';

const router = express.Router();

// @desc    Create a new trip request
// @route   POST /api/trips
// @access  Private (User must be logged in)
router.post('/', userProtect, createTrip);

// @desc    Get all active trips with live tracking (Admin)
// @route   GET /api/trips/live
// @access  Private (Admin)
router.get('/live', driverProtect, getLiveTrips);

// @desc    Get current user's trips
// @route   GET /api/trips/my
// @access  Private (User)
router.get('/my', userProtect, getMyTrips);

// @desc    Get trips assigned to current driver
// @route   GET /api/trips/assigned
// @access  Private (Driver)
router.get('/assigned', driverProtect, getAssignedTrips);

// @desc    List all requested trips
// @route   GET /api/trips/requested
// @access  Private (Driver)
router.get('/requested', driverProtect, getRequestedTrips);

// @desc    Get trip status by ID
// @route   GET /api/trips/:id/status
// @access  Private (User or Driver)
router.get('/:id/status', userProtect, getTripStatus);

// @desc    Cancel a trip
// @route   PUT /api/trips/:id/cancel
// @access  Private (User or Driver who accepted)
router.put('/:id/cancel', userProtect, cancelTrip);

// @desc    Driver accepts a trip
// @route   PATCH /api/trips/:id/accept
// @access  Private (Driver)
router.patch('/:id/accept', driverProtect, acceptTrip);

// @desc    Driver starts a trip
// @route   PATCH /api/trips/:id/start
// @access  Private (Driver)
router.patch('/:id/start', driverProtect, startTrip);

// @desc    Driver ends a trip
// @route   PATCH /api/trips/:id/end
// @access  Private (Driver)
router.patch('/:id/end', driverProtect, endTrip);

// @desc    Driver triggers SOS on a trip
// @route   POST /api/trips/:id/sos
// @access  Private (Driver)
router.post('/:id/sos', driverProtect, triggerSOS);

// @desc    Get last known location for a trip (user)
// @route   GET /api/trips/:id/last_location
// @access  Private (User)
router.get('/:id/last_location', userProtect, getLastLocation);

// @desc    Generate share token for public tracking
// @route   POST /api/trips/:id/share
// @access  Private (User)
router.post('/:id/share', userProtect, generateShareToken);

// @desc    Public last location by token
// @route   GET /api/trips/public/:token/last_location
// @access  Public
router.get('/public/:token/last_location', getPublicLastLocation);

// --- Lead fee & contact reveal ---
// Create checkout (mock) for lead fee
router.post('/:id/lead_fee/checkout', driverProtect, createLeadFeeCheckout);
// Mark lead fee paid (dev)
router.post('/:id/lead_fee/dev_paid', driverProtect, markLeadFeePaidDev);
// Get user contact for driver (gated)
router.get('/:id/contact', driverProtect, getTripContactForDriver);

// @desc    Driver cancels an accepted trip (adds strike)
// @route   PATCH /api/trips/:id/driver_cancel
// @access  Private (Driver)
router.patch('/:id/driver_cancel', driverProtect, driverCancelTrip);

export default router;
