
const azure = require('azure-storage');

const tableService = azure.createTableService(process.env.AzureConnString);
const tableName = "Checkins";

module.exports = function (context, req) {
    context.log('Start ItemRead');

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
                context.res.status(200).json(response.body.value);
            } else {
                context.res.status(500).json({error : error});
            }
          });

    } else {
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