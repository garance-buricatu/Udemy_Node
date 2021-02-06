const advancedResults = (model, populate) => async (req, res, next) => { // funciton inside of function
    //console.log(req.query); --> obtain all queries from url as a javascript object
    
    /**
     * REQ.QUERY EXAMPLES:
     * ?location.state=MA&housing=true --> logs as --> { 'location.state': 'MA', housing: 'true' }
     * ?averageCost[lte]=1000 --> logs as --> { averageCost: { lte: '1000' } }
     */

    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop thru removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery); // req.query is a JS object --> needs to be a string

    // In Mongoose, need: find( { qty: { $gt: 20 } } ) for gt/gte/lt/lte/in --> concatenate a "$" to these values in the req.query
    // Note: ?careers[in]=Business --> checks if "Business" is in "careers" array
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = model.find(JSON.parse(queryStr)); //queryString is a string, needs to be a JS object

    // Select Fields ie. ?select=name,description will return only name and description of all entries
    if (req.query.select) {

        // client will send ?select=name,description but according to Mongoose DB needs to be a string seperated by spaces
        // see mongoosejs.com/docs/queries.hyml
        const fields = req.query.select.split(',').join(' '); // 'select' is the field
        query = query.select(fields); // 'select' is a mongoose function
    }

    // Sort ie. $sort=name will sort the entires by alphabetical order of names
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt'); // (-) makes reverse sort
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1; // page that client is looking at (default: page 1)
    const limit = parseInt(req.query.limit, 10) || 25; // entries per page
    const startIndex = (page - 1) * limit; // ie. if on page 3 with limit=2, skip the first (2 * 2 = 4) entries (only display the last 2)
    const endIndex = page * limit;
    const total = await model.countDocuments(); // all objects in the database

    query = query.skip(startIndex).limit(limit);

    if (populate) {
        query = query.populate(populate);
    }
    
    // Executing Query
    const results = await query;

    // Pagination result --> sent in res, not saved into DB
    const pagination = {};
    if (endIndex < total) { // only displays if it is not the last page
        pagination.next ={
            page: page + 1,
            limit
        }
    };

    if (startIndex > 0){ // only displays if it is not the first page
        pagination.prev ={
            page: page - 1,
            limit
        }
    };

    res.advancedResults = {
        success: true,
        count: results.length,
        pagination,
        data: results
    }

    next();
}

module.exports = advancedResults;