const express = require('express');
const router = express.Router(); 

const { getUsers, getUser, createUser, updateUser, deleteUser } = require('../controllers/users');

const User = require('../models/User');

// Middleware
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // all routes below this line will use th eprotect middleware
router.use(authorize('admin'));

router.route('/').get(advancedResults(User), getUsers).post(createUser);

router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;