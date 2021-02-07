const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc Register User
// @route POST /api/v1/auth/register
// @access Public
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body;

    // Create user --> note body validation goes through model and is handled by Error middleware
    const user = await User.create({
        name,
        email,
        password,
        role
    });

    // send respoonse
    sendTokenResponse(user, 200, res);

    /**
     * IMPORTANT
     * - when this route is sent, token will be returned
     * - paste token in www.jwt.io --> see that token payload id = _id of user that was registered 
     * 
     * USUALLY...when user logs in...
     * - jwt token is stored in local storage
     * - when user wants to acces protected route, grab token from local storage to see if user is allowed
     * 
     * HOWEVER,
     * - security issues with storing JWT token in local storage
     * - instead send JWT token with cookie (store this is local storage)
     */
})

// @desc Login User
// @route POST /api/v1/auth/login
// @access Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // validate email and password
    if (!email || !password) {
        return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password'); // want password to be returned (in User model, password field is select:false)

    if (!user) {
        return next(new ErrorResponse('Invalid Credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password); // matchpassword() --> funciton created in User model

    if (!isMatch) return next(new ErrorResponse('Invalid Credentials', 401));

    // send respoonse
    sendTokenResponse(user, 200, res);
})

// Get token from model, create cookie, send response
const sendTokenResponse = (user, statusCode, res) => {
    
    // Create token --> use function created in User model
    // IMORTANT : function is being called on INSTANCE of user model
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    // in production mode, add secure flad to cookie
    if (process.env.NODE_ENV === 'production'){
        options.secure = true;
    }

    // Send cookie back with response --> in postman, cookie can be found in res/cookie header
    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token
    }); //cookie(key, value, options) --> key = name of cookie, value = token
};

// @desc Get current logged in user
// @route GET /api/v1/auth/me
// @access Provate
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user
    })
});