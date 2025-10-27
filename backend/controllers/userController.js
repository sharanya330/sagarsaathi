import { User } from '../models/usermodel.js';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Helper function to generate a JWT token (read env at call time to avoid ESM import order issues)
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET || 'your_development_secret';
    return jwt.sign({ id }, secret, {
        expiresIn: '7d',
    });
};

// @desc    Register a new user (Trip Requester)
// @route   POST /api/users/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;

    console.log("-> REGISTRATION ATTEMPT RECEIVED:", { email, phone });

    if (!name || !email || !phone || !password) {
        res.status(400);
        throw new Error('Please enter all required fields.');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists.');
    }

    // Create the new user (hashing handled by pre-save hook in UserModel.js)
    const newUser = await User.create({
        name,
        email,
        phone,
        password,
    });

    if (newUser) {
        res.status(201).json({
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            token: generateToken(newUser._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data provided.');
    }
});

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Must explicitly select the password field because select: false is used in schema
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and compare password
    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
    // userProtect attaches req.user without password
    res.json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
    });
});

// --- OTP Login (User) ---
export const sendUserOtp = asyncHandler(async (req, res) => {
    const { phone } = req.body;
    if (!phone) { res.status(400); throw new Error('Phone is required'); }
    const user = await User.findOne({ phone });
    if (!user) { res.status(404); throw new Error('User with this phone not found'); }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = code;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
    try {
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
            const { sendSms } = await import('../services/twilio.js');
            await sendSms(phone, `Your SagarSaathi OTP is ${code}. It expires in 5 minutes.`);
        } else {
            console.log(`DEV OTP (user ${phone}):`, code);
        }
    } catch (e) {
        console.error('OTP SMS send failed:', e?.message);
    }
    res.json({ message: 'OTP sent.', expiresInSec: 300 });
});

export const verifyUserOtp = asyncHandler(async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) { res.status(400); throw new Error('Phone and OTP are required'); }
    const user = await User.findOne({ phone }).select('+password');
    if (!user || !user.otpCode || !user.otpExpiresAt) { res.status(400); throw new Error('No OTP pending for this phone'); }
    if (user.otpCode !== otp || user.otpExpiresAt < new Date()) { res.status(401); throw new Error('Invalid or expired OTP'); }
    user.otpCode = null; user.otpExpiresAt = null; await user.save();
    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        token: generateToken(user._id),
    });
});
