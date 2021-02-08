const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please add a valid email'
        ]
    },
    role: {
        type: String,
        enum: ['user', 'publisher'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // when user is returned from API, password will not be displayed in res
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

/**
 * Mongoose Middleware - has access to all model fields, runs automatically
 */

// Encrypt Password using bcrypt (BEFORE saving to database)
UserSchema.pre('save', async function(next) { 
    
    // Only continue running middleware if password has been modified (otherwise no need to run this everytime changes are made to user & saved)
    if (!this.isModified('password')) next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return (NOT middleware - does not run automatically)
// A non-static methid (called on instance of model) --> "this.field" can access the field of the instance of the model this function is called on
UserSchema.methods.getSignedJwtToken = function() {
    // www.jwt.io --> see that JWT token has a payload (which we set as the current user's _id) --> now we can access the current logged in user through the jwt
    // see jsonwebtoken github for syntax

    // sign() --> takes payload as input which is the current user's _id field (since this method is NOT static, pertains to specific user's id)
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
} // call this method from the auth controller


// Match user entered entered password to hashed passowrd in DB
UserSchema.methods.matchPassword = async function(enteredPassword) {
    // enteredPassword --> plain text
    // this.password --. user's hashed password
    return await bcrypt.compare(enteredPassword, this.password);
}


// Generate and hash reset password token
UserSchema.methods.getResetPasswordToken = function() {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex'); // see doc

    // hash token and set to reset password field
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    return resetToken;

}


module.exports = mongoose.model('User', UserSchema);