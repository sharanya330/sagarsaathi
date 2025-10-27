import { Trip } from '../models/Tripmodel.js';
import { Driver } from '../models/Drivermodel.js';

// @desc    Create a new trip request
// @route   POST /api/trips
// @access  Private (User must be logged in)
export const createTrip = async (req, res) => {
    const { 
        pickUpName, pickUpCoords, dropOffName, dropOffCoords, 
        tripDistanceKm, estimatedPrice 
    } = req.body;

    if (!pickUpName || !dropOffName || !pickUpCoords || !dropOffCoords || !tripDistanceKm || !estimatedPrice) {
        return res.status(400).json({ message: 'Please provide all trip details.' });
    }

    try {
        const newTrip = await Trip.create({
            user: req.user._id,
            pickUpLocation: {
                name: pickUpName,
                coords: { type: 'Point', coordinates: pickUpCoords }
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
};

// @desc    Cancel a trip
// @route   PUT /api/trips/:id/cancel
// @access  Private (User or Driver who accepted)
export const cancelTrip = async (req, res) => {
    const tripId = req.params.id;
    const { cancellationReason } = req.body;

    try {
        const trip = await Trip.findById(tripId);

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }

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
};

// @desc    Get trip status by ID
// @route   GET /api/trips/:id/status
// @access  Private (User or Driver)
export const getTripStatus = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id).select('-locationHistory');

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }

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
};

// @desc    Get current user's trips
// @route   GET /api/trips/my
// @access  Private (User)
export const getMyTrips = async (req, res) => {
    try {
        const trips = await Trip.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json({ count: trips.length, trips });
    } catch (e) {
        console.error('List My Trips Error:', e);
        res.status(500).json({ message: 'Server error while fetching trips.' });
    }
};

// @desc    Get trips assigned to current driver
// @route   GET /api/trips/assigned
// @access  Private (Driver)
export const getAssignedTrips = async (req, res) => {
    try {
        const trips = await Trip.find({ 
            driver: req.user._id, 
            status: { $in: ['ACCEPTED', 'ON_TRIP'] } 
        }).sort({ createdAt: -1 });
        res.json({ count: trips.length, trips });
    } catch (e) {
        console.error('List Assigned Trips Error:', e);
        res.status(500).json({ message: 'Server error while fetching assigned trips.' });
    }
};

// @desc    List all requested trips
// @route   GET /api/trips/requested
// @access  Private (Driver)
export const getRequestedTrips = async (req, res) => {
    try {
        const trips = await Trip.find({ status: 'REQUESTED' }).sort({ createdAt: -1 });
        res.json({ count: trips.length, trips });
    } catch (e) {
        console.error('List Requested Trips Error:', e);
        res.status(500).json({ message: 'Server error while fetching requested trips.' });
    }
};

// @desc    Driver accepts a trip
// @route   PATCH /api/trips/:id/accept
// @access  Private (Driver)
export const acceptTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }
        
        if (trip.status !== 'REQUESTED') {
            return res.status(400).json({ message: 'Trip is not available to accept.' });
        }

        // Prevent overlapping by ensuring driver has no active trips
        const active = await Trip.findOne({ 
            driver: req.user._id, 
            status: { $in: ['ACCEPTED', 'ON_TRIP'] } 
        });
        
        if (active) {
            return res.status(400).json({ message: 'Driver already has an active trip.' });
        }

        trip.driver = req.user._id;
        trip.status = 'ACCEPTED';
        // Set lead fee when accepted (could be dynamic via config)
        if (!trip.leadFeeAmount || trip.leadFeeAmount <= 0) {
            trip.leadFeeAmount = Number(process.env.LEAD_FEE_AMOUNT || 99);
        }
        await trip.save();
        
        res.json({ 
            message: 'Trip accepted.', 
            tripId: trip._id, 
            status: trip.status,
            leadFeeAmount: trip.leadFeeAmount,
            leadFeePaid: trip.leadFeePaid
        });
    } catch (e) {
        console.error('Trip Accept Error:', e);
        res.status(500).json({ message: 'Server error during accept.' });
    }
};

// @desc    Driver starts a trip
// @route   PATCH /api/trips/:id/start
// @access  Private (Driver)
export const startTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }
        
        if (String(trip.driver) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Not assigned to this trip.' });
        }
        
        if (trip.status !== 'ACCEPTED') {
            return res.status(400).json({ message: 'Trip not in ACCEPTED state.' });
        }

        trip.status = 'ON_TRIP';
        trip.startTime = new Date();
        await trip.save();
        
        res.json({ message: 'Trip started.', status: trip.status });
    } catch (e) {
        console.error('Trip Start Error:', e);
        res.status(500).json({ message: 'Server error during start.' });
    }
};

// @desc    Driver ends a trip
// @route   PATCH /api/trips/:id/end
// @access  Private (Driver)
export const endTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }
        
        if (String(trip.driver) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Not assigned to this trip.' });
        }
        
        if (trip.status !== 'ON_TRIP') {
            return res.status(400).json({ message: 'Trip not in progress.' });
        }

        trip.status = 'COMPLETED';
        trip.endTime = new Date();
        await trip.save();
        
        res.json({ message: 'Trip completed.', status: trip.status });
    } catch (e) {
        console.error('Trip End Error:', e);
        res.status(500).json({ message: 'Server error during end.' });
    }
};

// @desc    Trigger SOS for a trip (driver)
// @route   POST /api/trips/:id/sos
// @access  Private (Driver)
export const triggerSOS = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: 'Trip not found.' });
        if (String(trip.driver) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Not assigned to this trip.' });
        }
        const { latitude, longitude } = req.body || {};
        trip.status = 'SOS_ACTIVE';
        if (latitude && longitude) {
            trip.locationHistory.push({
                coords: { type: 'Point', coordinates: [longitude, latitude] },
                timestamp: new Date()
            });
        }
        await trip.save();
        return res.json({ message: 'SOS activated for trip.', status: trip.status });
    } catch (e) {
        console.error('Trigger SOS Error:', e);
        return res.status(500).json({ message: 'Server error during SOS.' });
    }
};

// @desc    Get last known location for a trip (user)
// @route   GET /api/trips/:id/last_location
// @access  Private (User)
export const getLastLocation = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id).select('locationHistory user');
        if (!trip) return res.status(404).json({ message: 'Trip not found.' });
        if (String(trip.user) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized for this trip.' });
        }
        const last = trip.locationHistory?.length ? trip.locationHistory[trip.locationHistory.length - 1] : null;
        return res.json({ lastLocation: last });
    } catch (e) {
        console.error('Get Last Location Error:', e);
        return res.status(500).json({ message: 'Server error while fetching last location.' });
    }
};

// @desc    Generate a shareable tracking token for a trip (user)
// @route   POST /api/trips/:id/share
// @access  Private (User)
import crypto from 'crypto';
export const generateShareToken = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id).select('user trackingToken trackingTokenCreatedAt');
        if (!trip) return res.status(404).json({ message: 'Trip not found.' });
        if (String(trip.user) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized for this trip.' });
        }
        const token = crypto.randomBytes(16).toString('hex');
        trip.trackingToken = token;
        trip.trackingTokenCreatedAt = new Date();
        await trip.save();
        return res.json({ token });
    } catch (e) {
        console.error('Generate Share Token Error:', e);
        return res.status(500).json({ message: 'Server error while generating token.' });
    }
};

// @desc    Public last location via token (no auth)
// @route   GET /api/trips/public/:token/last_location
// @access  Public
export const getPublicLastLocation = async (req, res) => {
    try {
        const { token } = req.params;
        const trip = await Trip.findOne({ trackingToken: token }).select('locationHistory status');
        if (!trip) return res.status(404).json({ message: 'Invalid or expired link.' });
        const last = trip.locationHistory?.length ? trip.locationHistory[trip.locationHistory.length - 1] : null;
        return res.json({ lastLocation: last, status: trip.status });
    } catch (e) {
        console.error('Public Last Location Error:', e);
        return res.status(500).json({ message: 'Server error while fetching last location.' });
    }
};

// --- Lead Fee: create checkout (mock) ---
export const createLeadFeeCheckout = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: 'Trip not found.' });
        if (String(trip.driver) !== String(req.user._id)) return res.status(403).json({ message: 'Not assigned to this trip.' });
        if (trip.leadFeePaid) return res.json({ message: 'Already paid', paid: true });
        const amount = trip.leadFeeAmount || Number(process.env.LEAD_FEE_AMOUNT || 99);
        // TODO: integrate real provider (Stripe/Razorpay). For now, return mock order.
        const orderId = (await import('crypto')).then(m=>m.randomBytes(8).then(b=>b.toString('hex')));
        const resolvedOrderId = await orderId;
        return res.json({ provider: 'mock', currency: 'INR', amount, orderId: resolvedOrderId });
    } catch (e) {
        console.error('Lead fee checkout error:', e);
        return res.status(500).json({ message: 'Failed to create checkout.' });
    }
};

// --- Lead Fee: mark paid (dev) ---
export const markLeadFeePaidDev = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: 'Trip not found.' });
        if (String(trip.driver) !== String(req.user._id)) return res.status(403).json({ message: 'Not assigned to this trip.' });
        trip.leadFeePaid = true;
        trip.leadFeePaidAt = new Date();
        await trip.save();
        try {
            const { Transaction } = await import('../models/Transaction.js');
            await Transaction.create({ trip: trip._id, driver: trip.driver, amount: trip.leadFeeAmount || 0, currency: 'INR', type: 'LEAD_FEE', paidAt: trip.leadFeePaidAt });
        } catch (e) {
            console.error('Transaction log failed:', e?.message);
        }
        return res.json({ paid: true, paidAt: trip.leadFeePaidAt });
    } catch (e) {
        console.error('Lead fee mark paid error:', e);
        return res.status(500).json({ message: 'Failed to mark as paid.' });
    }
};

// --- Driver fetches user contact (gated by lead fee) ---
export const getTripContactForDriver = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id).populate('user', 'name phone');
        if (!trip) return res.status(404).json({ message: 'Trip not found.' });
        if (String(trip.driver) !== String(req.user._id)) return res.status(403).json({ message: 'Not assigned to this trip.' });
        const name = trip.user?.name || '';
        const phone = trip.user?.phone || '';
        const masked = phone ? phone.replace(/.(?=.{2})/g, 'x') : '';
        if (trip.leadFeePaid) {
            return res.json({ name, phone, paid: true });
        } else {
            return res.json({ name, maskedPhone: masked, paid: false, message: 'Lead fee required to reveal contact.' });
        }
    } catch (e) {
        console.error('Get contact error:', e);
        return res.status(500).json({ message: 'Failed to get contact.' });
    }
};

// @desc    Driver cancels an accepted trip (adds strike)
// @route   PATCH /api/trips/:id/driver_cancel
// @access  Private (Driver)
export const driverCancelTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }
        
        if (String(trip.driver) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Not assigned to this trip.' });
        }

        if (!['ACCEPTED', 'ON_TRIP'].includes(trip.status)) {
            return res.status(400).json({ message: 'Trip not active to cancel.' });
        }

        trip.status = 'CANCELLED';
        trip.cancellationReason = req.body?.reason || 'Driver cancelled';
        await trip.save();

        const driver = await Driver.findById(req.user._id);
        // Apply strike only if within threshold before scheduled start
        const hrs = Number(process.env.CANCEL_STRIKE_HOURS || 24);
        let addStrike = true;
        if (trip.scheduledStartDate) {
            const diffHrs = (new Date(trip.scheduledStartDate).getTime() - Date.now()) / 3600000;
            addStrike = diffHrs <= hrs;
        }
        if (addStrike) {
          driver.strikeCount = (driver.strikeCount || 0) + 1;
        }
        
        if (driver.strikeCount >= 3) {
            driver.isActive = false;
            driver.isVerified = false;
        }
        
        await driver.save();

        res.json({ 
            message: 'Trip cancelled by driver.', 
            strikeCount: driver.strikeCount, 
            driverActive: driver.isActive,
            strikeApplied: addStrike
        });
    } catch (e) {
        console.error('Driver Cancel Error:', e);
        res.status(500).json({ message: 'Server error during driver cancel.' });
    }
};
