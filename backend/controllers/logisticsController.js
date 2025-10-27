import { Driver } from '../models/Drivermodel.js';

// @desc    Update driver's current location (GeoJSON Point)
// @route   PUT /api/drivers/location
// @access  Private (Driver must be authenticated)
const updateDriverLocation = async (req, res) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    try {
        // MongoDB stores GeoJSON coordinates as [longitude, latitude]
        const locationUpdate = {
            type: 'Point',
            coordinates: [longitude, latitude]
        };

        const driver = await Driver.findByIdAndUpdate(
            req.user._id,
            { 
                location: locationUpdate,
                lastUpdated: new Date(),
                // Optionally set driver to active/available here based on logic
            },
            { new: true, select: '-password' } // Return the updated document without the password
        );

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found.' });
        }

        // Also append location to the active trip's history if any
        try {
            const { Trip } = await import('../models/Tripmodel.js');
            const activeTrip = await Trip.findOne({ driver: req.user._id, status: 'ON_TRIP' });
            if (activeTrip) {
                activeTrip.locationHistory.push({
                    coords: { type: 'Point', coordinates: [longitude, latitude] },
                    timestamp: new Date()
                });
                await activeTrip.save();
            }
        } catch (e) {
            console.error('Append to trip history failed:', e?.message);
        }

        return res.status(200).json({
            message: 'Location updated successfully.',
            location: driver.location
        });

    } catch (error) {
        console.error("Location Update Error:", error);
        res.status(500).json({ message: 'Server error during location update.' });
    }
};

// @desc    Search for nearby, verified, and active drivers with availability and ETA
// @route   GET /api/drivers/search
// @access  Public (Trip Requester/User App)
const findNearestDrivers = async (req, res) => {
    const { 
        latitude, 
        longitude, 
        maxDistanceKm = 50,
        startDate,
        endDate,
        vehicleType
    } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required for search.' });
    }

    try {
        const maxDistanceMeters = parseFloat(maxDistanceKm) * 1000;
        const { Trip } = await import('../models/Tripmodel.js');

        // Build match conditions
        const matchConditions = {
            isVerified: true,
            isActive: true
        };

        if (vehicleType) {
            matchConditions.vehicleType = vehicleType;
        }

        const nearbyDrivers = await Driver.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    distanceField: 'distance',
                    maxDistance: maxDistanceMeters,
                    spherical: true
                }
            },
            {
                $match: matchConditions
            },
            {
                $project: {
                    name: 1,
                    phone: 1,
                    isVerified: 1,
                    distance: 1,
                    location: 1,
                    vehicleType: 1,
                    capacity: 1,
                    vehicleModel: 1
                }
            }
        ]);

        // Filter by availability if dates provided
        let availableDrivers = nearbyDrivers;
        if (startDate && endDate) {
            const reqStart = new Date(startDate);
            const reqEnd = new Date(endDate);

            const driverIds = nearbyDrivers.map(d => d._id);
            const conflictingTrips = await Trip.find({
                driver: { $in: driverIds },
                status: { $in: ['ACCEPTED', 'ON_TRIP'] },
                $or: [
                    { scheduledStartDate: { $lte: reqEnd }, scheduledEndDate: { $gte: reqStart } }
                ]
            }).select('driver');

            const busyDriverIds = conflictingTrips.map(t => t.driver.toString());
            availableDrivers = nearbyDrivers.filter(d => !busyDriverIds.includes(d._id.toString()));
        }

        // Calculate ETA for each driver
        const driversWithETA = await Promise.all(availableDrivers.map(async (driver) => {
            const eta = await calculateETA(
                driver.location.coordinates[1],
                driver.location.coordinates[0],
                parseFloat(latitude),
                parseFloat(longitude)
            );
            return { ...driver, eta };
        }));

        return res.status(200).json({
            message: `${driversWithETA.length} verified drivers found within ${maxDistanceKm}km.`,
            count: driversWithETA.length,
            drivers: driversWithETA
        });

    } catch (error) {
        console.error("GeoSearch Error:", error);
        res.status(500).json({ message: 'Server error during nearby driver search.' });
    }
};

// Helper: Calculate ETA using Google Distance Matrix or haversine fallback
const calculateETA = async (lat1, lon1, lat2, lon2) => {
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    if (GOOGLE_MAPS_API_KEY) {
        try {
            const fetch = (await import('node-fetch')).default;
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat1},${lon1}&destinations=${lat2},${lon2}&key=${GOOGLE_MAPS_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.rows?.[0]?.elements?.[0]?.duration) {
                return {
                    minutes: Math.ceil(data.rows[0].elements[0].duration.value / 60),
                    source: 'google'
                };
            }
        } catch (err) {
            console.error('Google Distance Matrix error:', err.message);
        }
    }

    // Fallback: Haversine-based rough ETA
    const distance = haversineDistance(lat1, lon1, lat2, lon2);
    const avgSpeedKmh = 40; // Average city speed
    const minutes = Math.ceil((distance / avgSpeedKmh) * 60);
    
    return {
        minutes,
        source: 'haversine'
    };
};

// Haversine distance formula
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};


// @desc    Get live locations of all active drivers (for admin dashboard)
// @route   GET /api/drivers/live-locations
// @access  Private (Admin only)
const getLiveDriverLocations = async (req, res) => {
    try {
        const activeDrivers = await Driver.find(
            { isActive: true, isVerified: true },
            { name: 1, location: 1, vehicleType: 1, lastUpdated: 1 }
        );

        return res.status(200).json({
            count: activeDrivers.length,
            drivers: activeDrivers
        });
    } catch (error) {
        console.error('Live locations fetch error:', error);
        res.status(500).json({ message: 'Server error fetching live locations.' });
    }
};

// @desc    Get active trips with real-time location data
// @route   GET /api/trips/live
// @access  Private (Admin only)
const getLiveTrips = async (req, res) => {
    try {
        const { Trip } = await import('../models/Tripmodel.js');
        
        const activeTrips = await Trip.find(
            { status: { $in: ['ACCEPTED', 'ON_TRIP'] } }
        )
        .populate('driver', 'name phone location vehicleType vehicleNumber')
        .populate('user', 'name phone')
        .select('pickUpLocation dropOffLocation status locationHistory startTime scheduledStartDate');

        return res.status(200).json({
            count: activeTrips.length,
            trips: activeTrips
        });
    } catch (error) {
        console.error('Live trips fetch error:', error);
        res.status(500).json({ message: 'Server error fetching live trips.' });
    }
};

// @desc    Set driver availability range
// @route   POST /api/drivers/availability
// @access  Private (Driver authenticated)
const setDriverAvailability = async (req, res) => {
    const { startDate, endDate, isAvailable, reason } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required.' });
    }

    try {
        const driver = await Driver.findById(req.user._id);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found.' });
        }

        driver.availabilityRanges.push({
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isAvailable: isAvailable !== false, // Default true
            reason: reason || null
        });

        await driver.save();

        return res.status(200).json({
            message: 'Availability updated successfully.',
            availabilityRanges: driver.availabilityRanges
        });
    } catch (error) {
        console.error('Availability update error:', error);
        res.status(500).json({ message: 'Server error updating availability.' });
    }
};

// @desc    Get driver's availability calendar
// @route   GET /api/drivers/availability/:driverId
// @access  Public
const getDriverAvailability = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.driverId)
            .select('name vehicleType capacity availabilityRanges');

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found.' });
        }

        return res.status(200).json({
            driver: {
                name: driver.name,
                vehicleType: driver.vehicleType,
                capacity: driver.capacity
            },
            availabilityRanges: driver.availabilityRanges
        });
    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({ message: 'Server error fetching availability.' });
    }
};

export { 
    updateDriverLocation, 
    findNearestDrivers, 
    getLiveDriverLocations, 
    getLiveTrips,
    setDriverAvailability,
    getDriverAvailability
};
