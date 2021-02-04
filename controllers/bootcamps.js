const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

/**
 * NOTES
 * - Need body parser middleware (in server.js) in order to access "req.body" within these functions
 * - Always wrap in trycatch OR use asyncHandler
 * - If client sends data that is not in the model, it gets ignored
 */

// @desc Get all bootcamps
// @route GET /api/v1/bootcamps
// @access Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    const bootcamps = await Bootcamp.find();
    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    })

    // Catch block --> next(err);
});

// @desc Get single bootcamps
// @route GET /api/v1/bootcamps/:id
// @access Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    // handle err if id does not match any bootcamps in database
    if (!bootcamp) return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));

    res.status(200).json({
        success: true,
        data: bootcamp
    })
    
    // Catch block - handle err if id is not correct format (ie. # of digits) --> asyncHandler
    // next(err);
    
});

// @desc Create new bootcamp
// @route POST /api/v1/bootcamps
// @access Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.create(req.body);

    res.status(201).json({
        success: true,
        data: bootcamp
    });

    // Catch block --> handles duplicate keys AND handles form validation
    // next(err);
});

// @desc Update single bootcamp
// @route PUT /api/v1/bootcamps/:id
// @access Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        {
            new: true, // response become supdates data
            runValidators: true
        }
    );

    if (!bootcamp) return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));

    res.status(200).json({success: true, data: bootcamp});  
});

// @desc Delete Single Bootcamp
// @route DELETE /api/v1/bootcamps/:id
// @access Provate
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);

    if (!bootcamp) return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));

    res.status(200).json({success: true, data: {}});
});