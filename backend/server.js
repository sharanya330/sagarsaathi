import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io'; 
// Corrected Route Imports - Ensure no path contains 'backend'
import driverRoutes from 'backend/routes/driverRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tripRoutes from './routes/tripRoutes.js'; 
// Corrected Middleware Imports
import { notFound, errorHandler } from './middleware/errorMiddleware.js'; 

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// --- 1. Middleware ---
app.use(express.json());

// --- 2. Database Connection ---
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected Successfully.');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
connectDB();

// --- 3. API Routes ---
// Driver and Vetting Routes
app.use('/api/auth', driverRoutes);
app.use('/api/driver', driverRoutes);

// User Auth Routes
app.use('/api/users', userRoutes); 

// Trip Management Routes
app.use('/api/trips', driverRoutes); 
app.use('/api/trips', tripRoutes);

// --- 4. Error Handling Middleware ---
app.use(notFound);
app.use(errorHandler);

// --- 5. Socket.IO Setup for Real-Time ---
const server = http.createServer(app);

const io = new SocketIOServer(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log(`[Socket.IO] New client connected: ${socket.id}`);

    socket.on('location_update', (data) => {
        console.log(`[Socket.IO] Location update received from ${data.driverId}: Lat ${data.lat}, Lng ${data.lng}`);
        io.emit('driver_location', { 
            driverId: data.driverId, 
            lat: data.lat, 
            lng: data.lng 
        });
    });

    socket.on('SOS_TRIGGER', (data) => {
        console.warn(`[!!! SOS ALERT !!!] Triggered by Driver ${data.driverId} at Lat ${data.lat}, Lng ${data.lng}`);
        io.emit('admin_alert', { 
            driverId: data.driverId, 
            message: "Immediate SOS Alert", 
            location: { lat: data.lat, lng: data.lng } 
        });
    });

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
});

// --- 6. Start Server ---
server.listen(PORT, () => {
    console.log(`Sagarsaathi Backend Server running on port ${PORT}`);
    console.log(`API Endpoints: http://localhost:${PORT}/api/`);
});

