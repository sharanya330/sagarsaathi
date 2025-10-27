import jwt from 'jsonwebtoken';
import { Driver } from '../models/Drivermodel.js';
import { User } from '../models/usermodel.js'; // Added for User protection

// Middleware to protect DRIVER routes (only allows authenticated Drivers)
const driverProtect = async (req, res, next) => { // <-- RENAMED from 'protect'
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the DRIVER object and attach it to req.user (for consistency)
            req.user = await Driver.findById(decoded.id).select('-password'); // <-- ATTACHED TO req.user
            
            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, driver not found');
            }

            next();

        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Middleware to protect USER routes (only allows authenticated Trip Requesters)
const userProtect = async (req, res, next) => { // <-- NEW FUNCTION
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the USER object and attach it to req.user
            req.user = await User.findById(decoded.id).select('-password'); // <-- FETCHES USER MODEL

            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }
            
            next();

        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// The admin middleware is kept as-is, but note it relies on the existence of req.user
const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        return res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

// Admin bearer token protector using role claim
const adminProtect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.role === 'admin') {
        req.admin = { id: decoded.id || 'admin', email: decoded.email || null };
        return next();
      }
      return res.status(401).json({ message: 'Not authorized as admin' });
    } catch (e) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token provided' });
};

export { driverProtect, userProtect, admin, adminProtect };
