import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';

// Local Imports - CRITICAL: Ensure these files exist and use 'export default'
import connectDB from './config/db.js';
import userRoutes from '../routes/userRoutes.js'; 
import driverRoutes from '../routes/driverroutes.js';
import tripRoutes from '../routes/tripRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import paymentsRoutes from '../routes/paymentsRoutes.js';
import commRoutes from '../routes/commRoutes.js';

// Load environment variables
dotenv.config(); 

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration (Fixes the frontend registration issue) ---
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000']; 
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        // Allow explicit list
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Allow ngrok preview links during development
        if (/https?:\/\/.*\.ngrok-free\.app$/.test(origin)) return callback(null, true);
        // Allow localhost on any port (useful for dev)
        if (/https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies and auth headers to be sent
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
// ------------------------------------------------------------------

// Body parser middleware (allows us to accept JSON data)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically for document review
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// --- Routes ---
// The path must match the API_URL used in your frontend: http://localhost:5000/api/users/register
app.use('/api/users', userRoutes); 
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/comm', commRoutes);

// Basic check route
app.get('/', (req, res) => res.send('Sagarsaathi API is running...'));


// --- Error Handling Middleware (Recommended for Express) ---
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`Sagarsaathi Backend Server running on port ${PORT}`));
