import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io'; 
// Import error handling middleware
import { notFound, errorHandler } from './middleware/errorMiddleware.js'; 

// Import all routes (using clean default exports)
import userRoutes from './routes/userRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import tripRoutes from './routes/tripRoutes.js'; 

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI;

// --- 1. Middleware (CRITICAL: BODY PARSERS MUST BE FIRST) ---
app.use(express.json()); // Allows parsing of application/json request bodies
app.use(express.urlencoded({ extended: true })); // Allows parsing of form data request bodies

// --- 2. Database Connection ---
const connectDB = async () => {
    try {
        mongoose.set('debug', true); 
        
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected Successfully.');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
connectDB();

// --- 3. API Routes ---

// Simple Test Route for the base /api endpoint
app.get('/api', (req, res) => {
    res.json({ message: 'Sagarsaathi API is running successfully on port ' + PORT });
});

// Link all routes to the Express app (THESE MUST BE BELOW BODY PARSERS)
app.use('/api/users', userRoutes);
app.use('/api/auth', driverRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/trips', tripRoutes);

// --- 4. Error Handling Middleware (MUST be last) ---
app.use(notFound);
app.use(errorHandler);

// --- 5. Socket.IO Setup (Ensure http is imported) ---
const server = http.createServer(app);

const io = new SocketIOServer(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// Socket.IO Connection Handler (Placeholder for logic)
io.on('connection', (socket) => {
    console.log(`[Socket.IO] New client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
});

// --- 6. Start Server ---
server.listen(PORT, () => {
    console.log(`Sagarsaathi Backend Server running on port ${PORT}`);
    console.log(`API Endpoints: http://localhost:${PORT}/api/`);
});