const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, next) => {
    let error = {...err}

    error.message = err.message;

    // Log to console for dev
    console.log(err);

    // Mongoose bad object id format (ObjectId is object's _id passed in url)
    if (err.name === 'CastError') {
        const message = `Resource not found`; // console.log(err) to see all err fields
        error = new ErrorResponse(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new ErrorResponse(message, 400);
    }

    // Mongoose validation error (client not sending required fields)
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message); // console.log(err) to see err.errors array
        error = new ErrorResponse(message, 400);
    }

    res.status(error.statusCode).json({
        success: false,
        error: error.message || 'Server Error'
    });
}

module.exports = errorHandler;