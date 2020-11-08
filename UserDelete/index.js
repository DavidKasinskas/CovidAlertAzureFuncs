// Delete a user entity function

// Reference to the Azure Storage SDK
const azure = require('azure-storage');

// The TableService is used to send requests to the database
const tableService = azure.createTableService(process.env.AzureConnString);
const tableName = "Users";

module.exports = function (context, req) {

    // Check if id parameter was passed
    const id = req.params.id;
    if (id) {
        // Create a temporary object with PartitionKey & RowKey of the item which should be deleted
        var item = { PartitionKey: 'Partition', RowKey: id };
        tableService.deleteEntity(tableName, item, function (error, result, response) {
            if (!error) {
                // If there was no error return a 204 status code
                context.res.status(204).send();
            }
            else {
                // If there was an error return 500 server error code and the error
                context.res.status(500).json({error : error});
            }
        });
    }
    else {
        // Item to delete can't be found since no ID was passed
        context.res.status(404).send();
    }

};