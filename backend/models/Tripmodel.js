import mongoose from 'mongoose';

// Define the schema for GeoJSON Point locations
const LocationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
    }
}, { _id: false });

const TripSchema = new mongoose.Schema({
    // A. User and Driver References (The core transaction participants)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        default: null // Null until a driver accepts the trip
    },

    // B. Trip Details (Static data)
    pickUpLocation: {
        name: { type: String, required: true },
        coords: { type: LocationSchema, required: true }
    },
    dropOffLocation: {
        name: { type: String, required: true },
        coords: { type: LocationSchema, required: true }
    },
    tripDistanceKm: {
        type: Number,
        required: true
    },
    estimatedPrice: {
        type: Number,
        required: true
    },

    // C. State and Tracking
    status: {
        type: String,
        enum: ['REQUESTED', 'ACCEPTED', 'ON_TRIP', 'COMPLETED', 'CANCELLED', 'SOS_ACTIVE'],
        default: 'REQUESTED'
    },
    cancellationReason: {
        type: String,
        default: null
    },
    startTime: { type: Date },
    endTime: { type: Date },

    // D. Trip History (For accountability and safety checks)
    // NOTE: In a high-traffic app, this array would be offloaded to a dedicated service (like Redis/Kafka) 
    // but we keep it here for MVP simplicity.
    locationHistory: [{
        timestamp: { type: Date, default: Date.now },
        coords: LocationSchema
    }]

}, { timestamps: true });

// Create geospatial index for search queries if needed, though GeoJSON queries are usually faster
TripSchema.index({ 'pickUpLocation.coords.coordinates': '2dsphere' });

export const Trip = mongoose.model('Trip', TripSchema);