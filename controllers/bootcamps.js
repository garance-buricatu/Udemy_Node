const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const path = require('path'); //core node module

/**
 * NOTES
 * - Need body parser middleware (in server.js) in order to access "req.body" within these functions
 * - Always wrap in trycatch OR use asyncHandler
 * - If client sends data that is not in the model, it gets ignored
 */

// @desc Get all bootcamps
// @route GET /api/v1/bootcamps
// @access Public
exports.getBootcamps = asyncHandler(async (req, res, next) => { // has access to all variables in middleware advancedResults
    res.status(200).json(res.advancedResults);

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
// @access Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    // const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id); --> "findbyIdAndDelete" will not trigger the delete middleware in Bootcamp.js model
    
    // INSTEAD, 1. get the bootcamp
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));

    // 2. this will trigger middleware
    bootcamp.remove();

    res.status(200).json({success: true, data: {}});
});

// @desc Get bootcamps within a radius
// @route GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access Public
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
   const { zipcode, distance } = req.params;

   // get lat/long from geocoder
   const loc = await geocoder.geocode(zipcode);
   const lat = loc[0].latitude;
   const lng = loc[0].longitude;

   // Calculate radius using radians
    // Divide distance by radius of earth
    // Earth radius = 3,963 mi / 6,378 km
    const radius = distance / 3963;

    const bootcamps = await Bootcamp.find({
        location: { $geoWithin: { $centerSphere: [ [lng, lat], radius ]} }
    });

    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    });
});

// @desc Upload a photo for bootcamp
// @route PUT /api/v1/bootcamps/:id/photo
// @access Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
    
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));

    if (!req.files) return next(new ErrorResponse(`Please uoload file`, 400));

    // console.log(req.files); --> see how file is sent by postman

    const file = req.files.file;

    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    // Check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400));
    }

    // Need to change file name (in case someone adds another photo with same name, it won't get overwritten)
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`; // get extension of file name before changing it

    //console.log(file.name);

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if (err){
            console.error(err);
            return next(new ErrorResponse(`Problem with file upload`, 500));
        }

        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

        res.status(200).json({
            success: true,
            data: file.name
        })
    });
});