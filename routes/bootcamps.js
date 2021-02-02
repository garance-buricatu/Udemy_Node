const express = require('express');

const router = express.Router(); // allows api routes to be in different file than server.js

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
    const { getBootcamps, getBootcamp, createBootcamp, updateBootcamp, deleteBootcamp } = require('../controllers/bootcamps')
    //2. 
    router.route('/').get(getBootcamps).post(createBootcamp);
    router.route('/:id').get(getBootcamp).put(updateBootcamp).delete(deleteBootcamp);

module.exports = router;