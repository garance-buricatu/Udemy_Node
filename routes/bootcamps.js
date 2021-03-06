const express = require('express');

// allows api routes to be in different file than server.js
const router = express.Router();

const Bootcamp = require('../models/Bootcamp');

//Middleware
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

//Include other resource routers
const courseRouter = require('./courses');
const reviewRouter = require('./reviews');

// Re-route to other resource routers
    // if this route is hit, will continue on to './courses' which will call the appropriate route
    // allows re-routing so that no need to import 'getCourses' route in this file
router.use('/:bootcampId/courses', courseRouter);
router.use('/:bootcampId/reviews', reviewRouter);

// Notes: if APIs were in this file
    // 1. Replace "app.xxx" with "router.xxx"
    // 2. Since we imported the route "/api/v1/bootcamps" in server.js, replace that with "/"
    // 3. Export the router
// Example:
    // router.get('/', (req, res) => {
    //     res.status(200).json({success: true, msg: 'Get all bootcamps'});
    // });

// However, API logic will be in a middleware file (see ./controllers/bootcamps.js)
    //1. bring in API names from '../controller/bootcamps
    const { getBootcamps, getBootcamp, createBootcamp, updateBootcamp, deleteBootcamp, getBootcampsInRadius, bootcampPhotoUpload } = require('../controllers/bootcamps')

    // 2. 
    router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);
    router.route('/:id/photo').put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload); // NOTE: authorize middleware comes after protect bc changes the req.body and authorize uses this change
    router.route('/').get(advancedResults(Bootcamp, 'courses'), getBootcamps).post(protect, authorize('publisher', 'admin'), createBootcamp);
    router.route('/:id').get(getBootcamp).put(protect, authorize('publisher', 'admin'), updateBootcamp).delete(protect, authorize('publisher', 'admin'), deleteBootcamp);

module.exports = router;