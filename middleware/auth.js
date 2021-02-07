const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

/**
* Private Routes
* 
* - When user registers / logs in, a TOKEN is created
* - This token is stored in local storage/cookie on client side
*
* - Create a MIDDLEWARE to ensure a user is allowed to make requests to private routes
*
*        - token must be sent in req (Header --> { Authentication: Bearer --token-- })
*
*    - middleware will extract user _id from token, and look that user up in the database
**/

//Protect Route
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // can access all req headers with "req.headers"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    } 

    // else if (req.cookies.token) {
    //     token = req.cookies.token;
    // }

    // Make sure token exists
    if (!token) return next(new ErrorResponse('Not authorized to access this route', 401));

    try {
        
        //Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        //console.log(decoded); --> { id: '601f026737da7b441495971e', iat: 1612657940, exp: 1615249940 } 

        req.user = await User.findById(decoded.id); // now, in any route in which we use this middleware, the route will have access to "req.user" --> the user logged in!

        next();

    } catch (error) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorResponse(`User role ${req.user.role} is unauthorized`, 401));
        }
    }
}