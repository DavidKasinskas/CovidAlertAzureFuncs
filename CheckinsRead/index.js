// Read Checkin entities function

// Reference to Azure Storage SDK
const azure = require('azure-storage');

// The TableService is used to send requests to the database
const tableService = azure.createTableService(process.env.AzureConnString);
const tableName = "Checkins";

module.exports = function (context, req) {
    // Check for query parameters
    // If there are any check whether they contain user_key or venue_key
    // If it contains user_key query the DB for all checkins that have that user_key
    // If it contains venue_key query to DB for all checkins that have that venue_key
    // If not, return all chekin entities
    if(Object.keys(req.query).length > 0) {
        const item = req.query;
        let query;
        context.log(item);
        
        if('user_key' in item) {
            query = new azure.TableQuery()
            .where('user_key eq ?', item['user_key']);
        } else if('venue_key' in item) {
            query = new azure.TableQuery()
            .where('venue_key eq ?', item['venue_key']);
        }

        tableService.queryEntities(tableName,query, null, function(error, result, response) {
            if(!error){
                // If there were no errors with the request return the database response
                context.res.status(200).json(response.body.value);
            } else {
                // Else return a 500 server error code with the DB error as the body
                context.res.status(500).json({error : error});
            }
          });

    } else {
        // Query for all entities
        var query = new azure.TableQuery().select('RowKey', 'username', 'user_key', 'venuename', 'venue_key', 'date', 'hour');
        tableService.queryEntities(tableName, query, null, function (error, result, response) {
            if(!error){
                context.res.status(200).json(response.body.value);
            } else {
                context.res.status(500).json({error : error});
            }
        });
    }

    
};