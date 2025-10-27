import express from 'express';
import jwt from 'jsonwebtoken';
import { adminProtect } from '../middleware/authMiddleware.js';
import { Driver } from '../models/Drivermodel.js';
import { Trip } from '../models/Tripmodel.js';
import { User } from '../models/usermodel.js';

const router = express.Router();

// Admin login using env credentials (MVP)
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET || 'your_development_secret', { expiresIn: '8h' });
    return res.json({ token });
  }
  return res.status(401).json({ message: 'Invalid admin credentials' });
});

// Drivers list (basic)
router.get('/drivers', adminProtect, async (req, res) => {
  const drivers = await Driver.find().select('-password').sort({ createdAt: -1 });
  res.json({ count: drivers.length, drivers });
});

// Update verification/suspension
router.put('/drivers/:id/verify', adminProtect, async (req, res) => {
  const { isVerified, isActive } = req.body || {};
  const d = await Driver.findByIdAndUpdate(req.params.id, { 
    ...(typeof isVerified === 'boolean' ? { isVerified } : {}),
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
  }, { new: true }).select('-password');
  if (!d) return res.status(404).json({ message: 'Driver not found' });
  res.json(d);
});

// Trips: active and SOS
router.get('/trips/active', adminProtect, async (req, res) => {
  const trips = await Trip.find({ status: { $in: ['ACCEPTED','ON_TRIP','SOS_ACTIVE'] } })
    .select('user driver status pickUpLocation dropOffLocation startTime locationHistory createdAt')
    .sort({ updatedAt: -1 });
  res.json({ count: trips.length, trips });
});

router.get('/trips/sos', adminProtect, async (req, res) => {
  const trips = await Trip.find({ status: 'SOS_ACTIVE' })
    .select('user driver status pickUpLocation dropOffLocation startTime locationHistory createdAt')
    .sort({ updatedAt: -1 });
  res.json({ count: trips.length, trips });
});

router.post('/trips/:id/resolve_sos', adminProtect, async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  if (trip.status !== 'SOS_ACTIVE') return res.status(400).json({ message: 'Trip not in SOS' });
  trip.status = 'ON_TRIP';
  await trip.save();
  res.json({ message: 'SOS resolved', status: trip.status });
});

// Transactions
router.get('/transactions', adminProtect, async (req, res) => {
  try {
    const { Transaction } = await import('../models/Transaction.js');
    const tx = await Transaction.find().sort({ createdAt: -1 });
    res.json({ count: tx.length, transactions: tx });
  } catch (e) {
    res.json({ count: 0, transactions: [] });
  }
});

export default router;
