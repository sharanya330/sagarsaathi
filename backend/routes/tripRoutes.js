import express from 'express';
import { Trip } from '../models/TripModel.js';
import { protect } from '../../middleware/authMiddleware.js'; // Assuming we create a separate user-protect middleware later

const router = express.Router();

// NOTE: For the MVP, we are reusing the same 'protect' middleware from drivers, 
// but in production, you'd have a specific middleware to verify users vs drivers.

// @desc    Create a new trip request
// @route   POST /api/trips
// @access  Private (User must be logged in)
router.post('/', protect, async (req, res) => {
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
router.put('/:id/cancel', protect, async (req, res) => {
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
router.get('/:id/status', protect, async (req, res) => {
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

export default router;
