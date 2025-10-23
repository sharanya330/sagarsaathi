import mongoose from 'mongoose';

/**
 * @desc Connects to the MongoDB database using the URI from environment variables.
 * Exits the process if the connection fails.
 */
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB. process.env.MONGO_URI must be set in your .env file.
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`ERROR: Database connection failed. Details: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

// Export the function using ES Module syntax
export default connectDB;
