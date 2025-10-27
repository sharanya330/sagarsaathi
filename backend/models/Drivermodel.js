// Direct copy-paste content from earlier chat
import mongoose from 'mongoose';

// Schema for document uploads, like license or background check result
const DocumentSchema = new mongoose.Schema({
    type: { type: String, required: true, enum: ['LICENSE', 'BGV_REPORT', 'PROFILE_PHOTO'] },
    url: { type: String, required: true }, // URL to AWS S3 or similar storage
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' }
}, { _id: false });

// Main Driver Schema
const DriverSchema = new mongoose.Schema({
    // A. Auth & Basic Info (Required for registration)
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false }, // Should not return password hash by default
    
    // B. Vetting & Accountability
    isVerified: { type: Boolean, default: false }, // Set true after Admin reviews documents
    isActive: { type: Boolean, default: false }, // Status for taking trips (on/off duty)
    strikeCount: { type: Number, default: 0, max: 3 }, // For cancellation penalties
    documents: [DocumentSchema], // Array of verification documents

    // C. Real-Time Logistics (GeoJSON for location services)
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' } // [longitude, latitude]
    },
    lastUpdated: { type: Date, default: Date.now },

    // D. Vehicle Information
    vehicleType: {
        type: String,
        enum: ['SEDAN', 'SUV', 'INNOVA', 'TEMPO_TRAVELLER', 'BUS'],
        default: 'SEDAN'
    },
    capacity: { type: Number, default: 4 }, // Number of passengers the vehicle can hold
    vehicleNumber: { type: String, trim: true },
    vehicleModel: { type: String, trim: true },

    // E. Availability Calendar
    availabilityRanges: [{
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        isAvailable: { type: Boolean, default: true },
        reason: { type: String } // Optional reason for unavailability
    }],

    // OTP login (optional fields)
    otpCode: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null }

}, { timestamps: true });

// Create a geospatial index on the 'location.coordinates' field
DriverSchema.index({ 'location.coordinates': '2dsphere' });

// ✅ CORRECT (Checks if model exists; if so, use existing one; otherwise, compile a new one)
export const Driver = mongoose.models.Driver || mongoose.model('Driver', DriverSchema);