import express from 'express';
import { User } from '../models/UserModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
router.post('/register', async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: 'Please enter all required fields.' });
    }

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Mongoose pre-save hook handles password hashing

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
            res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (error) {
        console.error("User Registration Error:", error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Must explicitly select the password field because select: false is used in schema
        const user = await User.findOne({ email }).select('+password');

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error("User Login Error:", error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

export default router;
