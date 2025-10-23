import express from 'express';
// Correcting the model import path to ensure Node.js doesn't get confused
import { Driver } from '../models/Drivermodel.js'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Logistics imports
import { updateDriverLocation, findNearestDrivers } from '../controllers/logisticsController.js';
import { driverProtect } from '../middleware/authMiddleware.js';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'your_development_secret';

// Helper function to generate a JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, SECRET_KEY, {
        expiresIn: '7d',
    });
};

// @desc    Register a new driver
// @route   POST /api/drivers/register
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: 'Please enter all required fields.' });
    }

    try {
        const driverExists = await Driver.findOne({ email });

        if (driverExists) {
            return res.status(400).json({ message: 'Driver already exists.' });
        }

        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newDriver = await Driver.create({
            name,
            email,
            phone,
            password: hashedPassword,
        });

        if (newDriver) {
            res.status(201).json({
                _id: newDriver._id,
                name: newDriver.name,
                email: newDriver.email,
                phone: newDriver.phone,
                // Send back a token for immediate session login
                token: generateToken(newDriver._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid driver data' });
        }

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// @desc    Upload documents (Vetting Phase 1)
// @route   POST /api/driver/upload_doc
// @access  Private (Driver only)
router.post('/upload_doc', driverProtect, async (req, res) => {
    // This is a mock endpoint. In production, this would handle file uploads to S3/Cloud Storage.
    const { docType, docUrl } = req.body;

    try {
        const driver = await Driver.findById(req.user._id);

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found.' });
        }

        const newDoc = {
            type: docType,
            url: docUrl,
            status: 'PENDING'
        };

        driver.documents.push(newDoc);
        await driver.save();

        res.json({ message: 'Document submitted for review.', document: newDoc });

    } catch (error) {
        console.error("Document Upload Error:", error);
        res.status(500).json({ message: 'Server error during document upload.' });
    }
});

// @desc    Admin/System updates driver verification status (Vetting Phase 2)
// @route   PUT /api/driver/update_verification
// @access  Private/Admin (Should be protected by an isAdmin middleware)
router.put('/update_verification', driverProtect, async (req, res) => {
    // NOTE: This should be secured by Admin middleware in production.
    const { driverId, isVerified, isActive } = req.body;

    try {
        const driver = await Driver.findById(driverId);

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found.' });
        }
        
        // Update status flags
        driver.isVerified = isVerified ?? driver.isVerified;
        driver.isActive = isActive ?? driver.isActive;

        await driver.save();
        res.json({ message: 'Driver verification status updated.', driverStatus: { isVerified: driver.isVerified, isActive: driver.isActive } });

    } catch (error) {
        console.error("Verification Update Error:", error);
        res.status(500).json({ message: 'Server error during verification update.' });
    }
});

// @desc    Driver sends continuous location updates (Real-Time Phase)
// @route   PUT /api/driver/location
// @access  Private (Driver only)
router.put('/location', driverProtect, updateDriverLocation);

// @desc    Search for nearby available drivers (Logistics Phase)
// @route   GET /api/trips/search
// @access  Private (User only)
router.get('/search', driverProtect, findNearestDrivers);

// @desc    Authenticate driver & get token
// @route   POST /api/drivers/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const driver = await Driver.findOne({ email }).select('+password');
    if (driver && (await bcrypt.compare(password, driver.password))) {
      return res.json({
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        token: generateToken(driver._id),
      });
    }
    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (e) {
    console.error('Driver login error:', e);
    return res.status(500).json({ message: 'Server error during login.' });
  }
});

export default router;
