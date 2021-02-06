const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc Get all courses
// @route GET /api/v1/courses
// @route GET /api/v1/bootcamps/:bootcampid/courses
// @access Public

exports.getCourses = asyncHandler(async (req, res, next) => {

    if (req.params.bootcampId) {
        const courses = await Course.find({ bootcamp: req.params.bootcampId});

        return res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        })
    }

    else {
      res.status(200).json(res.advancedResults);  
    }
});

// @desc Get single course by id
// @route GET /api/v1/courses/:id
// @access Public

exports.getCourse = asyncHandler(async (req, res, next) => {
   const course = await Course.findById(req.params.id).populate({
       path: 'bootcamp',
       select: 'name description'
   });

   if (!course) {
       return next(new ErrorResponse(`No course with id of ${req.params.id}`), 404);
   }

    res.status(200).json({
        success: true,
        data: course
    });
});

// @desc Add course
// @route POST /api/v1/bootcamps/:bootcampid/courses
// @access Private

exports.addCourse = asyncHandler(async (req, res, next) => {
    req.body.bootcamp = req.params.bootcampId; //req.body.bootcamp refers to the 'bootcamp' field in the Course model

    const bootcamp = await Bootcamp.findById(req.params.bootcampId);
 
    if (!bootcamp) {
        return next(new ErrorResponse(`No bootcamp with id of ${req.params.bootcampId}`), 404);
    }

    const course = await Course.create(req.body);
 
     res.status(200).json({
         success: true,
         data: course
     });
 });

// @desc Update a course
// @route PUT /api/v1/courses/:id
// @access Private

exports.updateCourse = asyncHandler(async (req, res, next) => {

    let course = await Course.findById(req.params.id);
 
    if (!course) {
        return next(new ErrorResponse(`No course with id of ${req.params.id}`), 404);
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

     res.status(200).json({
         success: true,
         data: course
     });
 });

 // @desc Delete a course
// @route DELETE /api/v1/courses/:id
// @access Private

exports.deleteCourse = asyncHandler(async (req, res, next) => {

    const course = await Course.findById(req.params.id);
 
    if (!course) {
        return next(new ErrorResponse(`No course with id of ${req.params.id}`), 404);
    }

    await course.remove(); // cannot use findByIdAndDelete due to course middleware

     res.status(200).json({
         success: true,
         data: {}
     });
 });