import express from 'express';
import { User } from '../models/UserModel.js';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt'; 
import jwt from 'jsonwebtoken';

// --- FIX: Define router here ---
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'your_development_secret';

// Helper function to generate a JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, SECRET_KEY, {
        expiresIn: '7d',
    });
};

// @desc    Register a new user (Trip Requester)
// @route   POST /api/users/register
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;

    // Log received data for debugging (will be printed if successful)
    console.log("-> REGISTRATION ATTEMPT RECEIVED:", { email, phone });

    if (!name || !email || !phone || !password) {
        res.status(400); 
        throw new Error('Please enter all required fields.');
    }

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists.');
    }

    // 2. Create the new user (hashing handled by pre-save hook in UserModel.js)
    const newUser = await User.create({
        name,
        email,
        phone,
        password,
    });

    if (newUser) {
        // Success: Send back token and user data
        res.status(201).json({
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            token: generateToken(newUser._id),
        });
    } else {
        // Validation failed, or data not supplied correctly
        res.status(400); 
        throw new Error('Invalid user data provided.');
    }
}));


// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
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
        res.status(401); // Set status to 401 Unauthorized
        throw new Error('Invalid email or password');
    }
}));


export default router;