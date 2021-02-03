const { findByIdAndDelete } = require('../models/Bootcamp');
const Bootcamp = require('../models/Bootcamp');

/**
 * NOTES
 * - Need body parser middleware (in server.js) in order to access "req.body" within these functions
 * - Always wrap in trycatch
 * - If client sends data that is not in the model, it gets ignored
 */

// @desc Get all bootcamps
// @route GET /api/v1/bootcamps
// @access Public
exports.getBootcamps = async (req, res, next) => {
    try {
        const bootcamps = await Bootcamp.find();
        res.status(200).json({
            success: true,
            count: bootcamps.length,
            data: bootcamps
        })
    } catch (err) {
        res.status(400).json({
            success: false
        });
    }
};

// @desc Get single bootcamps
// @route GET /api/v1/bootcamps/:id
// @access Public
exports.getBootcamp = async (req, res, next) => {
    try {
        const bootcamp = await Bootcamp.findById(req.params.id);

        // handle err if id does not match any bootcamps
        if (!bootcamp) return res.status(400).json({success: false});

        res.status(200).json({
            success: true,
            data: bootcamp
        })
    } catch (err) {
        // handle err if id is not correct format (ie. # of digits)
        
        // res.status(400).json({
        //     success: false
        // });
        next(err);
    }
};

// @desc Create new bootcamp
// @route POST /api/v1/bootcamps
// @access Private
exports.createBootcamp = async (req, res, next) => {
    try {
        const bootcamp = await Bootcamp.create(req.body);

        res.status(201).json({
            success: true,
            data: bootcamp
        });
    } catch (err) {
        res.status(400).json({success: false});   
    }
};

// @desc Update single bootcamp
// @route PUT /api/v1/bootcamps/:id
// @access Private
exports.updateBootcamp = async (req, res, next) => {
    try {
        const bootcamp = await Bootcamp.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            {
                new: true, // response become supdates data
                runValidators: true
            }
        );
    
        if (!bootcamp) return res.status(400).json({success: false});  
    
        res.status(200).json({success: true, data: bootcamp});
    } catch (err) {
        res.status(400).json({success: false}); 
    }
    
};

// @desc Delete Single Bootcamp
// @route DELETE /api/v1/bootcamps/:id
// @access Provate
exports.deleteBootcamp = async (req, res, next) => {
    try {
        const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);

        if (!bootcamp) return res.status(400).json({success: false});  

        res.status(200).json({success: true, data: {}});

    } catch (err) {
        res.status(400).json({success: false}); 
    }
};