import express from 'express';
import { Trip } from '../models/Tripmodel.js'; // casing aligned to actual file
import { userProtect, driverProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// NOTE: For the MVP, we are reusing the same 'protect' middleware from drivers, 
// but in production, you'd have a specific middleware to verify users vs drivers.

// @desc    Create a new trip request
// @route   POST /api/trips
// @access  Private (User must be logged in)
router.post('/', userProtect, async (req, res) => {
    // req.user is provided by the 'protect' middleware after authentication
    const { 
        pickUpName, pickUpCoords, dropOffName, dropOffCoords, 
        tripDistanceKm, estimatedPrice 
    } = req.body;

    if (!pickUpName || !dropOffName || !pickUpCoords || !dropOffCoords || !tripDistanceKm || !estimatedPrice) {
        return res.status(400).json({ message: 'Please provide all trip details.' });
    }

    try {
        const newTrip = await Trip.create({
            user: req.user._id, // User ID from JWT token
            pickUpLocation: {
                name: pickUpName,
                coords: { type: 'Point', coordinates: pickUpCoords } // [Longitude, Latitude]
            },
            dropOffLocation: {
                name: dropOffName,
                coords: { type: 'Point', coordinates: dropOffCoords }
            },
            tripDistanceKm,
            estimatedPrice,
            status: 'REQUESTED'
        });

        // TO-DO: Implement WebSocket logic here to broadcast the 'REQUESTED' trip to nearby drivers.

        res.status(201).json({
            message: 'Trip requested successfully. Searching for drivers...',
            trip: newTrip
        });

    } catch (error) {
        console.error("Trip Creation Error:", error);
        res.status(500).json({ message: 'Server error while creating trip.' });
    }
});

// @desc    Cancel a trip
// @route   PUT /api/trips/:id/cancel
// @access  Private (User or Driver who accepted)
router.put('/:id/cancel', userProtect, async (req, res) => {
    const tripId = req.params.id;
    const { cancellationReason } = req.body;
    
    // NOTE: This logic needs to check if the user/driver has permission later (User === trip.user OR Driver === trip.driver)

    try {
        const trip = await Trip.findById(tripId);

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }

        // Apply penalty logic here (e.g., check timing, update driver strikeCount)
        // For now, just change status.
        
        trip.status = 'CANCELLED';
        trip.cancellationReason = cancellationReason || 'Canceled by user/system.';
        await trip.save();

        res.status(200).json({
            message: 'Trip successfully canceled.',
            tripStatus: trip.status
        });

    } catch (error) {
        console.error("Trip Cancellation Error:", error);
        res.status(500).json({ message: 'Server error during cancellation.' });
    }
});

// @desc    Get trip status by ID
// @route   GET /api/trips/:id/status
// @access  Private (User or Driver)
router.get('/:id/status', userProtect, async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id).select('-locationHistory'); // Exclude heavy history data

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }

        // NOTE: In production, check if req.user._id matches trip.user or trip.driver before returning

        res.status(200).json({
            status: trip.status,
            driverId: trip.driver,
            pickUp: trip.pickUpLocation.name,
            dropOff: trip.dropOffLocation.name,
            tripId: trip._id
        });
    } catch (error) {
        console.error("Get Status Error:", error);
        res.status(500).json({ message: 'Server error while fetching status.' });
    }
});

// Get current user's trips
router.get('/my', userProtect, async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ count: trips.length, trips });
  } catch (e) {
    console.error('List My Trips Error:', e);
    res.status(500).json({ message: 'Server error while fetching trips.' });
  }
});

// Get trips assigned to current driver (active first)
router.get('/assigned', driverProtect, async (req, res) => {
  try {
    const trips = await Trip.find({ driver: req.user._id, status: { $in: ['ACCEPTED','ON_TRIP'] } }).sort({ createdAt: -1 });
    res.json({ count: trips.length, trips });
  } catch (e) {
    console.error('List Assigned Trips Error:', e);
    res.status(500).json({ message: 'Server error while fetching assigned trips.' });
  }
});

// List all requested trips (MVP; later filter by proximity)
router.get('/requested', driverProtect, async (req, res) => {
  try {
    const trips = await Trip.find({ status: 'REQUESTED' }).sort({ createdAt: -1 });
    res.json({ count: trips.length, trips });
  } catch (e) {
    console.error('List Requested Trips Error:', e);
    res.status(500).json({ message: 'Server error while fetching requested trips.' });
  }
});

// Driver accepts a trip
router.patch('/:id/accept', driverProtect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    if (trip.status !== 'REQUESTED') return res.status(400).json({ message: 'Trip is not available to accept.' });

    // Prevent overlapping by ensuring driver has no active trips
    const active = await Trip.findOne({ driver: req.user._id, status: { $in: ['ACCEPTED','ON_TRIP'] } });
    if (active) return res.status(400).json({ message: 'Driver already has an active trip.' });

    trip.driver = req.user._id;
    trip.status = 'ACCEPTED';
    await trip.save();
    res.json({ message: 'Trip accepted.', tripId: trip._id, status: trip.status });
  } catch (e) {
    console.error('Trip Accept Error:', e);
    res.status(500).json({ message: 'Server error during accept.' });
  }
});

// Driver starts a trip
router.patch('/:id/start', driverProtect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    if (String(trip.driver) !== String(req.user._id)) return res.status(403).json({ message: 'Not assigned to this trip.' });
    if (trip.status !== 'ACCEPTED') return res.status(400).json({ message: 'Trip not in ACCEPTED state.' });

    trip.status = 'ON_TRIP';
    trip.startTime = new Date();
    await trip.save();
    res.json({ message: 'Trip started.', status: trip.status });
  } catch (e) {
    console.error('Trip Start Error:', e);
    res.status(500).json({ message: 'Server error during start.' });
  }
});

// Driver ends a trip
router.patch('/:id/end', driverProtect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    if (String(trip.driver) !== String(req.user._id)) return res.status(403).json({ message: 'Not assigned to this trip.' });
    if (trip.status !== 'ON_TRIP') return res.status(400).json({ message: 'Trip not in progress.' });

    trip.status = 'COMPLETED';
    trip.endTime = new Date();
    await trip.save();
    res.json({ message: 'Trip completed.', status: trip.status });
  } catch (e) {
    console.error('Trip End Error:', e);
    res.status(500).json({ message: 'Server error during end.' });
  }
});

// Driver cancels an accepted trip -> strike
import { Driver } from '../models/Drivermodel.js';
router.patch('/:id/driver_cancel', driverProtect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    if (String(trip.driver) !== String(req.user._id)) return res.status(403).json({ message: 'Not assigned to this trip.' });

    if (!['ACCEPTED','ON_TRIP'].includes(trip.status)) return res.status(400).json({ message: 'Trip not active to cancel.' });

    trip.status = 'CANCELLED';
    trip.cancellationReason = req.body?.reason || 'Driver cancelled';
    await trip.save();

    const driver = await Driver.findById(req.user._id);
    driver.strikeCount = (driver.strikeCount || 0) + 1;
    if (driver.strikeCount >= 3) {
      driver.isActive = false;
      driver.isVerified = false;
    }
    await driver.save();

    res.json({ message: 'Trip cancelled by driver.', strikeCount: driver.strikeCount, driverActive: driver.isActive });
  } catch (e) {
    console.error('Driver Cancel Error:', e);
    res.status(500).json({ message: 'Server error during driver cancel.' });
  }
});

export default router;
