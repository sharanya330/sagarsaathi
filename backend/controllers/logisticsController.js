import { Driver } from '../models/Drivermodel.js';

// @desc    Update driver's current location (GeoJSON Point)
// @route   PUT /api/driver/location
// @access  Private (Driver must be authenticated)
const updateDriverLocation = async (req, res) => {
    // req.driver is provided by the 'protect' middleware
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
            req.driver._id,
            { 
                location: locationUpdate,
                lastUpdated: new Date(),
                // Optionally set driver to active/available here based on logic
            },
            { new: true, select: '-password' } // Return the updated document without the password
        );

        if (driver) {
            return res.status(200).json({
                message: 'Location updated successfully.',
                location: driver.location
            });
        } else {
            return res.status(404).json({ message: 'Driver not found.' });
        }

    } catch (error) {
        console.error("Location Update Error:", error);
        res.status(500).json({ message: 'Server error during location update.' });
    }
};

// @desc    Search for nearby, verified, and active drivers
// @route   GET /api/trips/search
// @access  Public (Trip Requester/User App)
const findNearestDrivers = async (req, res) => {
    // Destructure query params
    const { latitude, longitude, maxDistanceKm = 50 } = req.query; // Default to 50km radius

    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required for search.' });
    }

    try {
        // Convert maxDistanceKm to meters for MongoDB's $nearSphere query
        const maxDistanceMeters = parseFloat(maxDistanceKm) * 1000;

        const nearbyDrivers = await Driver.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)] // [longitude, latitude]
                    },
                    distanceField: 'distance', // Output field name for distance
                    maxDistance: maxDistanceMeters, // Max distance in meters
                    spherical: true // Use spherical geometry for Earth-like distances
                }
            },
            {
                $match: {
                    isVerified: true, // Only show drivers who have passed vetting
                    isActive: true // Only show drivers who are currently on-duty
                }
            },
            {
                $project: { // Only return essential, non-sensitive data
                    name: 1,
                    phone: 1, // Will be masked by an external service later
                    isVerified: 1,
                    distance: 1,
                    location: 1
                }
            }
        ]);

        return res.status(200).json({
            message: `${nearbyDrivers.length} verified drivers found within ${maxDistanceKm}km.`,
            count: nearbyDrivers.length,
            drivers: nearbyDrivers
        });

    } catch (error) {
        console.error("GeoSearch Error:", error);
        res.status(500).json({ message: 'Server error during nearby driver search.' });
    }
};


export { updateDriverLocation, findNearestDrivers };
