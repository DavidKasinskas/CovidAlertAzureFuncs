// Create user function

// Reference to the Azure Storage SDK
const azure = require('azure-storage');
// Reference to the uuid package which helps us to create 
// unique identifiers for our PartitionKey
const { v4: uuidv4 } = require('uuid');

// The TableService is used to send requests to the database
const tableService = azure.createTableService(process.env.AzureConnString);
const tableName = "Users";

module.exports = function (context, req) {
    context.log('Start ItemCreate');

    if (req.body) {

        // Adding PartitionKey & RowKey as they are required for any data stored in Azure Table Storage
        const item = req.body;
        item["PartitionKey"] = "Partition";
        item["RowKey"] = uuidv4();

        tableService.insertEntity(tableName, item, { echoContent: true }, function (error, result, response) {
            if (!error) {
                // Return a 201 status code + the database response inside the body
                // This response automatically triggers a context.done()
                context.res.status(201).json(response);
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