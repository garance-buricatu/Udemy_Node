const express = require('express');

const { getCourses, getCourse, addCourse, updateCourse, deleteCourse } = require('../controllers/courses');

const Course = require('../models/Course');

// Middleware
const advancedResults = require('../middleware/advancedResults');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true }); // mergeParams used for re-routing from bootcamps routes to courses routes

router.route('/').get(advancedResults(Course, 
    // populate the course's bootcamp field with the bootcamp name and description
    { 
        path: 'bootcamp',
        select: 'name description'
    }
), getCourses).post(protect, addCourse);

router.route('/:id').get(getCourse).put(protect, updateCourse).delete(protect, deleteCourse);

module.exports = router;