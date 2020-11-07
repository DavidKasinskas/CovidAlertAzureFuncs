const azure = require('azure-storage');

const tableService = azure.createTableService(process.env.AzureConnString);
const tableName = "Venues";

module.exports = function (context, req) {
    context.log('Start ItemUpdate');

    const id = req.params.id;
    if (req.body) {

        // TODO: Add some object validation logic
        const item = req.body;
        item.RowKey = id;
        item.PartitionKey = 'Partition';

        context.log(item);

        // Depending on how you want this to behave you can also use tableService.mergeEntity
        tableService.replaceEntity(tableName, item, function (error, result, response) {
            if (!error) {
                context.res.status(202).json(result);
            } else {
                context.res.status(500).json({ error: error });
            }
        });
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass an item in the request body"
        };
        context.done();
    }

};