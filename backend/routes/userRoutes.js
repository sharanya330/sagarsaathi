import express from 'express';
import { userProtect } from '../middleware/authMiddleware.js';
import { registerUser, loginUser, getUserProfile, sendUserOtp, verifyUserOtp } from '../controllers/userController.js';

const router = express.Router();

// @desc    Register a new user (Trip Requester)
// @route   POST /api/users/register
// @access  Public
router.post('/register', registerUser);

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
router.post('/login', loginUser);

// @desc    Send OTP to user's phone
// @route   POST /api/users/otp/send
// @access  Public (rate-limit in production)
router.post('/otp/send', sendUserOtp);

// @desc    Verify OTP and login
// @route   POST /api/users/otp/verify
// @access  Public
router.post('/otp/verify', verifyUserOtp);

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
router.get('/me', userProtect, getUserProfile);

export default router;
