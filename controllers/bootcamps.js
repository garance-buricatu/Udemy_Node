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
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    
    //console.log(req.query); --> obtain all queries from url as a javascript object
    
    /**
     * REQ.QUERY EXAMPLES:
     * ?location.state=MA&housing=true --> logs as --> { 'location.state': 'MA', housing: 'true' }
     * ?averageCost[lte]=1000 --> logs as --> { averageCost: { lte: '1000' } }
     */

    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop thru removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery); // req.query is a JS object --> needs to be a string

    // In Mongoose, need: find( { qty: { $gt: 20 } } ) for gt/gte/lt/lte/in --> concatenate a "$" to these values in the req.query
    // Note: ?careers[in]=Business --> checks if "Business" is in "careers" array
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Bootcamp.find(JSON.parse(queryStr)).populate('courses'); //queryString is a string, needs to be a JS object

    // Select Fields ie. ?select=name,description will return only name and description of all entries
    if (req.query.select) {

        // client will send ?select=name,description but according to Mongoose DB needs to be a string seperated by spaces
        // see mongoosejs.com/docs/queries.hyml
        const fields = req.query.select.split(',').join(' '); // 'select' is the field
        query = query.select(fields); // 'select' is a mongoose function
    }

    // Sort ie. $sort=name will sort the entires by alphabetical order of names
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt'); // (-) makes reverse sort
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1; // page that client is looking at (default: page 1)
    const limit = parseInt(req.query.limit, 10) || 25; // entries per page
    const startIndex = (page - 1) * limit; // ie. if on page 3 with limit=2, skip the first (2 * 2 = 4) entries (only display the last 2)
    const endIndex = page * limit;
    const total = await Bootcamp.countDocuments(); // all objects in the database

    query = query.skip(startIndex).limit(limit);
    
    // Executing Query
    const bootcamps = await query;

    // Pagination result --> sent in res, not saved into DB
    const pagination = {};
    if (endIndex < total) { // only displays if it is not the last page
        pagination.next ={
            page: page + 1,
            limit
        }
    }

    if (startIndex > 0){ // only displays if it is not the first page
        pagination.prev ={
            page: page - 1,
            limit
        }
    }
    
    res.status(200).json({
        success: true,
        count: bootcamps.length,
        pagination,
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