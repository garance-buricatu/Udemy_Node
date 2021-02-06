const express = require('express');

const { getCourses, getCourse, addCourse, updateCourse, deleteCourse } = require('../controllers/courses');
const { deleteMany } = require('../models/Course');

const router = express.Router({ mergeParams: true }); // mergeParams used for re-routing from bootcamps routes to courses routes

router.route('/').get(getCourses).post(addCourse);
router.route('/:id').get(getCourse).put(updateCourse).delete(deleteCourse);

module.exports = router;