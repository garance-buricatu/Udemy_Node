const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const colors = require('colors');
const hpp = require('hpp');
const cors = require('cors');

// Middlwares
const errorHandler = require('./middleware/error');

/**
*-------------------- EXPRESS APIs ---(see routes/bootcamps file)------------
* app.get('/', (req, res) => {
*    1. res.send('<h1>Hello from express</h1>'); --> depending on if plain text, html, or json is sent, res headers will change accrodingly and res will be properly displayed in the client
*
*     NOTE: when sending json, use "res.json"
*     res.json({ name: "Garance" }) --> note: javascript object will be automatically changed to json objet using express (JSON.stringify done behind the scenes)
* 
*     2. To change status code
*     res.status(400).json({ success: false });
*     res.status(200).json({success: true});
* })
*/

/**
 * ------------------- EXPRESS MIDDLEWARE-----------------------------
 * a function that has access to the req/res cycle 
 * 
 * whenever a req is made by the client, the testMiddleware function is going to run
 * 
 * EXAMPLE:
 *       const testMiddleware = (req, res, next) => {
 *           req.hello = 'Hello World'; // all api functions can use this "req.hello" variable
 *           console.log('Middleware ran');
 *           next(); // obligatory for all middleware functions --> tells to move on to the next middleware
 *       }
 *       app.use(testMiddleware);
 * 
 * Note: all middleware functions are in './middleware' folder
 * 
 * IMPORTING CUSTOM MIDDLEWARE
 *      const logger = require('./middleware/logger');
 *      app.use(logger);
 * 
 */

// load env vars
dotenv.config({path: './config/config.env'});

// connect to database
connectDB();

// Import route files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

const app = express();

// Body Parser --> allows APIs to use "req.body" variable
app.use(express.json());

// Cookie Parser
app.use(cookieParser())


//** Morgan dev logging middleware */
if (process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

// File Uploading
app.use(fileupload());

/**
 * Sanitize Data
 * ie. in Login User route, before adding mongoSanitize, user could type:
 *  "email": {"$gt":""}, "password": "123456"
 * and get logged in wihtout the correct email
 */

app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent xss attacks - ie if bad guy sends form data with script tags to mess up database
app.use(xss());

// Rate limting - limits to 100 requests / 10 mins
const limiter = rateLimit({
    window: 10 * 60 * 1000, // 10 mins
    max: 100
});

app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable cors
app.use(cors());

// Set 'public' filder as static
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers (from bootcamps file)
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

app.use(errorHandler);

const PORT = process.env.PORT || 7000;

// run server
const server = app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold));

// Handle unhandled promise rejections (ie. async await promises)
process.on('unhandledRejection', (err, promise) => {
        console.log(`Error: ${err.message}`.red);

        // Close server and exit process
        server.close(() => process.exit(1));
});