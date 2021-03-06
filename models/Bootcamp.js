const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');

const BootcampSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxLength: [50, "Name cannot be more than 50 characters"]
    },
    slug: String,
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description can not be more than 500 characters']
      },
      website: {
        type: String,
        match: [
          /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
          'Please use a valid URL with HTTP or HTTPS'
        ]
      },
      phone: {
        type: String,
        maxlength: [20, 'Phone number can not be longer than 20 characters']
      },
      email: {
        type: String,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please add a valid email'
        ]
      },
      address: {
        type: String,
        required: [true, 'Please add an address']
      },
      location: {
        // GeoJSON Point
        type: {
          type: String,
          enum: ['Point']
        },
        coordinates: {
          type: [Number],
          index: '2dsphere'
        },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
      },
      careers: {
        // Array of strings
        type: [String],
        required: true,
        // only avaliable values that it can have
        enum: [
          'Web Development',
          'Mobile Development',
          'UI/UX',
          'Data Science',
          'Business',
          'Other'
        ]
      },
      averageRating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [10, 'Rating must can not be more than 10']
      },
      averageCost: Number,
      photo: {
        type: String,
        default: 'no-photo.jpg'
      },
      housing: {
        type: Boolean,
        default: false
      },
      jobAssistance: {
        type: Boolean,
        default: false
      },
      jobGuarantee: {
        type: Boolean,
        default: false
      },
      acceptGi: {
        type: Boolean,
        default: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // reference the User model
        required: true
      } 

}, {
  toJSON: { virtuals: true},
  toObject: { virtuals: true }
});

/**
 * MONGOOSE MIDDLEWARE
 */

// Create bootcamp slug from the name
BootcampSchema.pre('save', function(next) { // this will run before saving

  console.log('Slugify ran', this.name); // notice that this runs when the model is created (through API)

  // all model fields can be access as so:
  this.slug = slugify(this.name, { lower:true }); // check slugify doc

  // API response will contain the newly created slug field

  next();
})

// Geocode and create location field
BootcampSchema.pre('save', async function(next) {
  const loc = await geocoder.geocode(this.address);

  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipCode,
    country: loc[0].countryCode
  };

  // Do not save address inputed by client in DB (use formattedAddress given by geocoder instead)
  this.address = undefined;

  next();
});

// Cascade delete courses when bootcamp is deleted (if bootcamp is deleted, delete all cooresponding courses)
BootcampSchema.pre('remove', async function (next) {
  console.log(`Courses are being removed from bootcamp ${this._id}`);

  // Delete courses with bootcamp field = this._id (current bootcamp)
      // Note: this must be "pre" middleware (if it were "post", since we are deleting the bootcamp, we would not be able to access "this" fields)
  await this.model('Course').deleteMany({ bootcamp: this._id }); 
  next();
})

// Reverse Populate with Virtuals (populate Bootcamp object with all courses it coresponds to)
  // This creates a new field called 'courses' in Bootcamp model that holds all courses coresponding to bootcamp
  // NOTE: this does NOT get saved on the DB
BootcampSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'bootcamp', // field in the Course model that is tageted
  justOne: false // need an array
})

module.exports = mongoose.model('Bootcamp', BootcampSchema);