// Update an user entity function

// Reference to the Azure Storage SDK
const azure = require('azure-storage');

// The TableService is used to send requests to the database
const tableService = azure.createTableService(process.env.AzureConnString);
const tableName = "Users";

module.exports = function (context, req) {

    // Get the user id parameter to determine Entity that has to be updated
    const id = req.params.id;

    // When upading an entity, the whole object with all fields has to be passed
    // Since tableService.replaceEntity replaces the whole entity with the given id parameter
    if (req.body) {

        const item = req.body;
        item.RowKey = id;
        item.PartitionKey = 'Partition';

        tableService.replaceEntity(tableName, item, function (error, result, response) {
            if (!error) {
                // If no errors return result from db
                context.res.status(202).json(result);
            } else {
                // In case of an error we return a 500 server error code and the database error
                context.res.status(500).json({ error: error });
            }
        });
    }
    else {
        // Return an error message if an object was not passed tot he request body
        context.res = {
            status: 400,
            body: "Please pass an item in the request body"
        };
        context.done();
    }

};