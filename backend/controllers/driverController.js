import { Driver } from '../models/Drivermodel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Helper function to generate a JWT token (read env at call time to avoid ESM import order issues)
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET || 'your_development_secret';
    return jwt.sign({ id }, secret, {
        expiresIn: '7d',
    });
};

// @desc    Register a new driver
// @route   POST /api/drivers/register
// @access  Public
export const registerDriver = async (req, res) => {
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
                token: generateToken(newDriver._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid driver data' });
        }

    } catch (error) {
        console.error("Driver Registration Error:", error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// @desc    Authenticate driver & get token
// @route   POST /api/drivers/login
// @access  Public
export const loginDriver = async (req, res) => {
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
};

// --- OTP Login (Driver) ---
export const sendDriverOtp = async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone is required' });
    try {
        const driver = await Driver.findOne({ phone });
        if (!driver) return res.status(404).json({ message: 'Driver with this phone not found' });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        driver.otpCode = code;
        driver.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await driver.save();
        try {
            if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
                const { sendSms } = await import('../services/twilio.js');
                await sendSms(phone, `Your SagarSaathi OTP is ${code}. It expires in 5 minutes.`);
            } else {
                console.log(`DEV OTP (driver ${phone}):`, code);
            }
        } catch (e) { console.error('OTP SMS failed:', e?.message); }
        return res.json({ message: 'OTP sent.', expiresInSec: 300 });
    } catch (e) {
        console.error('Send driver OTP error:', e);
        return res.status(500).json({ message: 'Server error sending OTP.' });
    }
};

export const verifyDriverOtp = async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP are required' });
    try {
        const driver = await Driver.findOne({ phone });
        if (!driver || !driver.otpCode || !driver.otpExpiresAt) return res.status(400).json({ message: 'No OTP pending for this phone' });
        if (driver.otpCode !== otp || driver.otpExpiresAt < new Date()) return res.status(401).json({ message: 'Invalid or expired OTP' });
        driver.otpCode = null; driver.otpExpiresAt = null; await driver.save();
        return res.json({
            _id: driver._id,
            name: driver.name,
            email: driver.email,
            phone: driver.phone,
            token: generateToken(driver._id),
        });
    } catch (e) {
        console.error('Verify driver OTP error:', e);
        return res.status(500).json({ message: 'Server error verifying OTP.' });
    }
};

// @desc    Get current driver profile
// @route   GET /api/drivers/me
// @access  Private
export const getDriverProfile = async (req, res) => {
    try {
        // req.user is attached by driverProtect and excludes password
        return res.json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone,
            isVerified: req.user.isVerified,
            isActive: req.user.isActive,
            strikeCount: req.user.strikeCount ?? 0
        });
    } catch (e) {
        console.error('Get driver profile error:', e);
        return res.status(500).json({ message: 'Failed to fetch profile.' });
    }
};

// @desc    Upload documents (Vetting Phase 1)
// @route   POST /api/drivers/upload_doc
// @access  Private (Driver only)
export const uploadDocument = async (req, res) => {
    try {
        const driver = await Driver.findById(req.user._id);

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found.' });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const { docType } = req.body;
        if (!docType || !['LICENSE', 'BGV_REPORT', 'PROFILE_PHOTO'].includes(docType)) {
            return res.status(400).json({ message: 'Invalid document type.' });
        }

        // Create document URL -> prefer S3 if configured
        let docUrl = `/uploads/${req.file.filename}`;
        try {
            if (process.env.AWS_S3_BUCKET) {
                const { uploadBufferToS3 } = await import('../services/s3.js');
                const filePath = path.join(process.cwd(), 'uploads', req.file.filename);
                const buffer = fs.readFileSync(filePath);
                const key = `driver_docs/${driver._id}/${Date.now()}_${req.file.originalname}`;
                const uploadedUrl = await uploadBufferToS3(buffer, key, req.file.mimetype || 'application/octet-stream');
                if (uploadedUrl) docUrl = uploadedUrl;
            }
        } catch (e) {
            console.error('S3 upload failed, serving local file:', e?.message);
        }

        const newDoc = {
            type: docType,
            url: docUrl,
            status: 'PENDING'
        };

        driver.documents.push(newDoc);
        await driver.save();

        res.json({ 
            message: 'Document submitted for review.', 
            document: newDoc,
            filename: req.file.filename 
        });

    } catch (error) {
        console.error("Document Upload Error:", error);
        res.status(500).json({ message: 'Server error during document upload.' });
    }
};

// @desc    Upload multiple driver documents at once
// @route   POST /api/drivers/upload_documents
// @access  Private (Driver only)
export const uploadMultipleDocuments = async (req, res) => {
    try {
        const driver = await Driver.findById(req.user._id);

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found.' });
        }

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ message: 'No files uploaded.' });
        }

        const uploadedDocs = [];

        // Process each uploaded file
        const s3Enabled = !!process.env.AWS_S3_BUCKET;
        const maybeUpload = async (file, type) => {
            let url = `/uploads/${file.filename}`;
            if (s3Enabled) {
                try {
                    const { uploadBufferToS3 } = await import('../services/s3.js');
                    const filePath = path.join(process.cwd(), 'uploads', file.filename);
                    const buffer = fs.readFileSync(filePath);
                    const key = `driver_docs/${req.user._id}/${Date.now()}_${file.originalname}`;
                    const uploadedUrl = await uploadBufferToS3(buffer, key, file.mimetype || 'application/octet-stream');
                    if (uploadedUrl) url = uploadedUrl;
                } catch (e) { console.error('S3 upload failed:', e?.message); }
            }
            driver.documents.push({ type, url, status: 'PENDING' });
        };

        if (req.files.license) {
            const file = req.files.license[0];
            await maybeUpload(file, 'LICENSE');
            uploadedDocs.push('LICENSE');
        }

        if (req.files.rc) {
            const file = req.files.rc[0];
            await maybeUpload(file, 'BGV_REPORT');
            uploadedDocs.push('RC');
        }

        if (req.files.permit) {
            const file = req.files.permit[0];
            await maybeUpload(file, 'BGV_REPORT');
            uploadedDocs.push('PERMIT');
        }

        if (req.files.selfie) {
            const file = req.files.selfie[0];
            await maybeUpload(file, 'PROFILE_PHOTO');
            uploadedDocs.push('SELFIE');
        }

        await driver.save();

        res.json({ 
            message: 'Documents submitted for review.', 
            uploadedDocuments: uploadedDocs,
            totalUploaded: uploadedDocs.length
        });

    } catch (error) {
        console.error("Multiple Document Upload Error:", error);
        res.status(500).json({ message: 'Server error during document upload.' });
    }
};

// @desc    Admin/System updates driver verification status (Vetting Phase 2)
// @route   PUT /api/drivers/update_verification
// @access  Private/Admin (Should be protected by an isAdmin middleware)
export const updateVerification = async (req, res) => {
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
        res.json({ 
            message: 'Driver verification status updated.', 
            driverStatus: { 
                isVerified: driver.isVerified, 
                isActive: driver.isActive 
            } 
        });

    } catch (error) {
        console.error("Verification Update Error:", error);
        res.status(500).json({ message: 'Server error during verification update.' });
    }
};
