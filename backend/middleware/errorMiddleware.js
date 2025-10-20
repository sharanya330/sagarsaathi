// Middleware for handling 404 (Not Found) errors
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Middleware for handling all other errors (including Mongoose errors)
const errorHandler = (err, req, res, next) => {
    // CRITICAL DEBUGGING: Force the full error stack to be logged to the console
    console.error("GLOBAL SERVER ERROR CAUGHT:", err); 
    
    // Determine the status code (default to 500 if a 200 was still set)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    res.status(statusCode).json({
        // Send the error message to the frontend for display
        message: err.message, 
        
        // Include the stack trace only in development mode for security
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export { notFound, errorHandler };