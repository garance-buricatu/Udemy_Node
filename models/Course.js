const mongoose = require('mongoose');
const Bootcamp = require('./Bootcamp');

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a course title']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    weeks: {
        type: String,
        required: [true, 'Please add number of weeks']
    },
    tuition: {
        type: Number,
        required: [true, 'Please add a tuition cost']
    },
    minimumSkill: {
        type: String,
        required: [true, 'Please add a minimum skill'],
        enum: ['beginner', 'intermediate', 'advanced']
    },
    scholarshipAvaliable: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    bootcamp: {
        type: mongoose.Schema.ObjectId,
        ref: 'Bootcamp', // reference the Bootcamp model
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // reference the User model
        required: true
    }
});

/**
 * MONGOOSE MIDDLEWARE
 */

 // Static method to get avg of course tuitions (static method gets called on Model object)
 //     NOTE: each bootcamp has an array of courses --> this function calculates the average cost of a particular bootcamp's courses

 CourseSchema.statics.getAverageCost = async function(bootcampId) {
    //console.log('Calculating avg cost... '.blue);

    const obj = await this.aggregate([ // aggregate funciton called on entire Course model
        {   
            $match: { bootcamp: bootcampId }
        },
        {
            $group: {
                _id: '$bootcamp',
                averageCost: { $avg: '$tuition' }
            }
        }
    ]); // ie. console.log(obj) --> [ { _id: 5d725a1b7b292f5f8ceff788, averageCost: 11250 } ], where _id is id of a bootcamp

    // Save averageCost to DB (at Bootcamp object)
    try {
        // get Bootcamp field from Course
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, { averageCost: Math.ceil(obj[0].averageCost / 10) * 10 }); // log obj to understand
    } catch (err) {
        console.error(err);
    }
 }

//Call getAverage Cost after save
CourseSchema.post('save', function() {
    this.constructor.getAverageCost(this.bootcamp);
});

// Call getAverageCost before remove
CourseSchema.pre('remove', function() {
    this.constructor.getAverageCost(this.bootcamp);
});

module.exports = mongoose.model('Course', CourseSchema);