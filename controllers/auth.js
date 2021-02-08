const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

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

// @desc Update user details (ONLY name and email)
// @route PUT /api/v1/auth/updateDetails
// @access Private
exports.updateDetails = asyncHandler(async (req, res, next) => {

    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: user
    })
});

// @desc Update Password
// @route PUT /api/v1/auth/updatepassword
// @access Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))){
        return next(new ErrorResponse('Password is incorrect', 401));
    }

    user.password = req.body.newPassword;

    await user.save();

    sendTokenResponse(user, 200, res);
});

// @desc Forgot Password
// @route POST /api/v1/auth/forgotPassword
// @access Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) return next(new ErrorResponse('There is no user with that email', 404));

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    // getResetpasswordToken makes changes to user fields --> need to save changes to database
    await user.save({ validateBeforeSave : false}); // no need to run model validators

    // Create reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/resetPassword/${resetToken}`;

    // Note if we had a frontend to this application, this would be a link to a page with button that calls this api
    const message = `You are receiving this email because you or someone else has made a request to reset password. Please make a PUT request to \n\n ${resetURL}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Token',
            message
        })

        res.status(200).json({ success: true, data: 'Email Sent'});

    } catch (err) {
        console.log(error);
        user.resetPasswordToken = undefined;
        user.resetpasswordExpire = undefined;

        await user.save({ validateBeforeSave: false});

        return next(new ErrorResponse('Email could not be sent', 500));
    }
});

// @desc Reset Password (after forgotpassword)
// @route PUT /api/v1/auth/resetPassword/:resttoken
// @access Public
exports.resetPassword = asyncHandler(async (req, res, next) => {

    /**
     * Idea: 
     * - when user called forgotPassword, unique resetToken was created
     * - this reset token was HASHED and set as the user's resetpasswordToken
     * - this rest token (NOT HASHED) was used to create a resetPassword API/link
     * 
     * When a user calls resetPassword()/clicks on link, if the user's resetPasswordToken is equal to the hashed reset token (in the link), this means it was in fact that same user that called forgotPassword
     * - now this user's password can be changed
     */

    // get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

    const user = await User.findOne({
        resetPasswordToken,  
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return next(new ErrorResponse('Invalid Token', 400));

    // Set new password
    user.password = req.body.password; // will be encrypted in DB due to middleware in User
    user.resetPasswordToken = undefined;
    user.resetpasswordExpire = undefined; // will not be saved to DB

    await user.save();

    sendTokenResponse(user, 200, res);
});

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