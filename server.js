const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Import route files
const bootcamps = require('./routes/bootcamps');

// load env vars
dotenv.config({path: './config/config.env'});

const app = express();

//** INFO ON EXPRESS APIs - see routes/bootcamps file*/

// app.get('/', (req, res) => {
//     1. res.send('<h1>Hello from express</h1>'); --> depending on if plain text, html, or json is sent, res headers will change accrodingly and res will be properly displayed in the client

//     NOTE: when sending json, use "res.json"
//     res.json({ name: "Garance" }) --> note: javascript object will be automatically changed to json objet using express (JSON.stringify done behind the scenes)

//     2. To change status code
//     res.status(400).json({ success: false });

//     res.status(200).json({success: true});
// })

//** Express middleware - a function that has access to the req/res cycle and has access to that cycle */
// ie. whenever a req is made by the client, the testMiddleware function is going to run
        // const testMiddleware = (req, res, next) => {
        //     req.hello = 'Hello World'; // all api functions can use this "req.hello" variable
        //     console.log('Middleware ran');
        //     next(); // obligatory for all middleware functions --> tells to move on to the next middleware
        // }
        // app.use(testMiddleware);
// Note: all middleware functions are in './middleware' folder

//** Importing custom middleware */
        // const logger = require('./middleware/logger');
        // app.use(logger);

//** Morgan dev logging middleware */
if (process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

// Mount routers (from bootcamps file)
app.use('/api/v1/bootcamps', bootcamps);

const PORT = process.env.PORT || 5000;

// run server
app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));