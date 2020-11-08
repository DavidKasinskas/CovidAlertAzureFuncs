
// Read notifications function

// Reference to the Azure Storage SDK
const azure = require('azure-storage');

// The TableService is used to send requests to the database
const tableService = azure.createTableService(process.env.AzureConnString);
const tableName = "Notifications";

module.exports = function (context, req) {

    // Check for id parameter
    // If there is, return the notification with RowKey = id
    // If not, return all chekin entities
    const id = req.params.id;
    if (id) {
        // return item with RowKey 'id'
        tableService.retrieveEntity(tableName, 'Partition', id, function (error, result, response) {
            if (!error) {
                // If there were no errors with the request return the database response
                context.res.status(200).json(response.body);
            }
            else {
                // Else return a 500 server error code with the DB error as the body
                context.res.status(500).json({error : error});
            }
        });
    }
    else {
        // Query for all entities
        var query = new azure.TableQuery().select('userNotified', 'infectedUser', 'venue', 'Timestamp', 'RowKey');
        tableService.queryEntities(tableName, query, null, function (error, result, response) {
            if(!error){
                context.res.status(200).json(response.body.value);
            } else {
                context.res.status(500).json({error : error});
            }
        });
    }
};