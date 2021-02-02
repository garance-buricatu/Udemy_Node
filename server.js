const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');

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
 * a function that has access to the req/res cycle and has access to that cycle
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

const app = express();

//** Morgan dev logging middleware */
if (process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

// Mount routers (from bootcamps file)
app.use('/api/v1/bootcamps', bootcamps);

const PORT = process.env.PORT || 7000;

// run server
const server = app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

// Handle unhandled promise rejections (ie. async await promises)
process.on('unhandledRejection', (err, promise) => {
        console.log(`Error: ${err.message}`);

        // Close server and exit process
        server.close(() => process.exit(1));
});