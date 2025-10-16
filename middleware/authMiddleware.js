import jwt from 'jsonwebtoken';
import { Driver } from '../models/DriverModel.js';

// Middleware to protect routes (ensure user is logged in)
const protect = async (req, res, next) => {
    let token;

    // Check for Authorization header and ensure it starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (split "Bearer token")
            token = req.headers.authorization.split(' ')[1];

            // Verify token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user/driver from the database using the token's payload ID
            // We only select required fields for the request lifecycle, NOT the sensitive password hash.
            req.driver = await Driver.findById(decoded.id).select('-password');
            
            // Proceed to the next middleware or the route handler
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

// Middleware to ensure the authenticated user is an Admin (placeholder for later use)
const admin = (req, res, next) => {
    // NOTE: In a full app, the User model would have an isAdmin field.
    // Since we only have the Driver model now, this is a simplified placeholder.
    // Later, you would implement a User model and a proper role system.
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        return res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

export { protect, admin };
