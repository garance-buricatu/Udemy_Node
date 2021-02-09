const express = require('express');

const { getReviews, getReview, addReview, updateReview, deleteReview } = require('../controllers/reviews');

const Review = require('../models/Review');

// Middleware
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true }); // mergeParams used for re-routing from bootcamps routes to courses routes

router.route('/').get(advancedResults(Review, 
    // populate the reviews bootcamp field with the bootcamp name and description
    { 
        path: 'bootcamp',
        select: 'name description'
    }
), getReviews).post(protect, authorize('user', 'admin'), addReview);

router.route('/:id').get(getReview).put(protect, authorize('user', 'admin'), updateReview).delete(protect, authorize('user', 'admin'), deleteReview);


module.exports = router;