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
    
    // Multi-stop support for custom itineraries
    stops: [{
        name: { type: String },
        coords: { type: LocationSchema },
        arrivalTime: { type: Date },
        departureTime: { type: Date },
        notes: { type: String }
    }],
    
    // Trip metadata
    tripDistanceKm: {
        type: Number,
        required: true
    },
    estimatedPrice: {
        type: Number,
        required: true
    },
    actualPrice: {
        type: Number
    },
    
    // Trip scheduling
    scheduledStartDate: { type: Date },
    scheduledEndDate: { type: Date },
    tripDurationDays: { type: Number, default: 1 },
    
    // Additional details
    numberOfPassengers: { type: Number, default: 1 },
    vehicleType: { 
        type: String, 
        enum: ['SEDAN', 'SUV', 'INNOVA', 'TEMPO_TRAVELLER', 'BUS'],
        default: 'SEDAN'
    },
    specialRequirements: { type: String },

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

    // Lead fee gating
    leadFeeAmount: { type: Number, default: 0 },
    leadFeePaid: { type: Boolean, default: false },
    leadFeePaidAt: { type: Date, default: null },

    // D. Trip History (For accountability and safety checks)
    // NOTE: In a high-traffic app, this array would be offloaded to a dedicated service (like Redis/Kafka) 
    // but we keep it here for MVP simplicity.
    locationHistory: [{
        timestamp: { type: Date, default: Date.now },
        coords: LocationSchema
    }],

    // E. Public tracking token (for shareable tracking links)
    trackingToken: { type: String, default: null, index: true },
    trackingTokenCreatedAt: { type: Date, default: null },

}, { timestamps: true });

// Create geospatial index for search queries if needed, though GeoJSON queries are usually faster
TripSchema.index({ 'pickUpLocation.coords.coordinates': '2dsphere' });

export const Trip = mongoose.model('Trip', TripSchema);
