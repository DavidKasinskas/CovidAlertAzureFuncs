
const azure = require('azure-storage');
const { v4: uuidv4 } = require('uuid');

const tableService = azure.createTableService(process.env.AzureConnString);
const tableName = "Notifications";

module.exports = function (context, req) {
    context.log('Start ItemRead');

    const id = req.params.userId;
    if (id) {
        
        // Query: Get venues and time the user has been to in the last two weeks
        const fortnightAgo = new Date(Date.now() - 12096e5);
        const query = new azure.TableQuery()
                                .select('venue_key', 'date', 'username', 'user_key')
                                .where('user_key eq ?', id)
                                .and('date ge ?', fortnightAgo);

        tableService.queryEntities('Checkins',query, null, function(error, result, response) {
            if(!error){
                const userCheckins = (response.body.value);
                const batch = new azure.TableBatch()
                
                let notifications = []

                let counter = 0;

                if(userCheckins == 0)
                    context.res.status(200).json(notifications);
                

                userCheckins.forEach((checkin) => {

                    let nextDay = new Date(checkin.date);
                        nextDay.setHours(0);
                        nextDay.setMinutes(0);
                        nextDay.setDate(nextDay.getDate() + 1);
                    
                    let userQuery = new azure.TableQuery()
                                             .where('venue_key eq ?', checkin.venue_key)
                                             .and('date ge ?', new Date(checkin.date))
                                             .and('date lt ?', nextDay)
                                             .and('user_key ne ?', id);
                    

                    tableService.queryEntities('Checkins', userQuery, null, function(error, result, response) {

                        context.log(counter);
                        context.log(userCheckins.length);

                        if(!error){
                            counter = counter + 1;

                            response.body.value.forEach(item => {
                                notification = {
                                    PartitionKey: {'_' : 'Partition'},
                                    RowKey: {'_' : uuidv4()},
                                    userNotified: item.username,
                                    userNotified_Key: item.user_key,
                                    'userCheckInDate@odata.type' : 'Edm.DateTime',
                                    userCheckInDate : item.date,
                                    infectedUser: checkin.username,
                                    infectedUser_Key: checkin.user_key,
                                    venue: item.venuename,
                                    venue_key: item.venue_key
                                }
                                //notifications.push(notification)
                                batch.insertEntity(notification)
                            })

                        } else {
                            context.res.status(500).json({error : error});
                        }

                        if(counter == userCheckins.length - 1) {
                            //context.res.status(200).json(notifications)
                            setTimeout(() => {

                                if(batch.size() == 0) {
                                    context.res.status(200).json({statusText: 'No Notifications'});
                                } else {
                                    tableService.executeBatch('Notifications', batch, function(error, result, response) {
                                        if(!error){
                                            context.res.status(201).json(response);
                                        } else {
                                            context.res.status(500).json({error : error});
                                        }
                                    })
                                }

                                
                            }, 500)
                        }

                    })
                })

            } else {
                context.res.status(500).json({error : error});
            }
          });
    }
    else {
        // return the top 100 items
        var query = new azure.TableQuery().select('name', 'surname', 'infected', 'checkins', 'RowKey');
        tableService.queryEntities(tableName, query, null, function (error, result, response) {
            if(!error){
                context.res.status(200).json(response.body.value);
            } else {
                context.res.status(500).json({error : error});
            }
        });
    }
};