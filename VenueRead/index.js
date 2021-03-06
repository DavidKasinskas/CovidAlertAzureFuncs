
const azure = require('azure-storage');

const tableService = azure.createTableService(process.env.AzureConnString);
const tableName = "Venues";

module.exports = function (context, req) {
    context.log('Start ItemRead');

    const id = req.params.id;
    if (id) {
        // return item with RowKey 'id'
        tableService.retrieveEntity(tableName, 'Partition', id, function (error, result, response) {
            if (!error) {
                context.res.status(200).json(response.body);
            }
            else {
                context.res.status(500).json({error : error});
            }
        });
    }
    else {
        var query = new azure.TableQuery().select('name', 'checkins', 'last_checkin', 'RowKey');
        tableService.queryEntities(tableName, query, null, function (error, result, response) {
            if(!error){
                context.res.status(200).json(response.body.value);
            } else {
                context.res.status(500).json({error : error});
            }
        });
    }
};