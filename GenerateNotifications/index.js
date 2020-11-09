
// Generating notifications function

// Reference to the Azure Storage SDK
const azure = require('azure-storage');
// Reference to the uuid package which helps us to create 
// unique identifiers for our PartitionKey
const { v4: uuidv4 } = require('uuid');

// The TableService is used to send requests to the database
const tableService = azure.createTableService(process.env.AzureConnString);
const tableName = "Notifications";

module.exports = function (context, req) {

    // Get the user id parameter
    const id = req.params.userId;

    // If a user id is passed, that user is being marked as positive
    // If a user id is not passed, return an error specifying userId is required
    if (id) {
        
        // Query: Get venues and time the user has been to in the last two weeks
        const fortnightAgo = new Date(Date.now() - 12096e5); // Date two weeks ago
        const query = new azure.TableQuery()
                                .select('venue_key', 'date', 'username', 'user_key')
                                .where('user_key eq ?', id)
                                .and('date ge ?', fortnightAgo);
                                

        tableService.queryEntities('Checkins',query, null, function(error, result, response) {
            // If the query was successful, proceed with querying the database further
            // Else, return an error message
            if(!error){
                const userCheckins = (response.body.value); // The database response

                // Insert the test entity before creating notifications
                let test = {
                    positive: true,
                    user_key: id
                }                
                test["PartitionKey"] = "Partition";
                test["RowKey"] = uuidv4();

                tableService.insertEntity('PositiveTests', test, { echoContent: true }, function (error, result, response) {
                    // Return an error response if there was an error
                    if (error) {
                        context.res.status(500).json({ error: error });
                    }
                    });

                const batch = new azure.TableBatch(); // Table batch is used to execute multiple operations on the DB at once
                
                let notifications = [];

                // Use a counter since we don't want to return before every user checkin is checked
                let counter = 0;

                // If the user has not checked in anywhere, return an empty array
                if(userCheckins == 0)
                    context.res.status(200).json(notifications);

                // Else, go through each checkin of the user and create a query
                // Query for other checkins in the same day (after the time that user with userId has checked), 
                //                                 for the same venue
                //                                 not done by the user with userId
                // Each notification represents a checkin that is returned by those queries 
                userCheckins.forEach((checkin) => {

                    let nextDay = new Date(checkin.date);
                        nextDay.setHours(0);
                        nextDay.setMinutes(0);
                        nextDay.setDate(nextDay.getDate() + 1);
                    
                    // Create the query to get potential users that might have had contact with the infection
                    let userQuery = new azure.TableQuery()
                                             .where('venue_key eq ?', checkin.venue_key) // Same venue as the infected user
                                             .and('date ge ?', new Date(checkin.date)) //  After he has checked in
                                             .and('date lt ?', nextDay) // But not after that day
                                             .and('user_key ne ?', id); // Don't return the initial user checkin
                    

                    tableService.queryEntities('Checkins', userQuery, null, function(error, result, response) {

                        if(!error){
                            counter = counter + 1; // Increment counter

                            // Create a notification entity object
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
                                batch.insertEntity(notification) // Insert the entity into the batch
                            })

                        } else {
                            context.res.status(500).json({error : error});
                        }

                        if(counter == userCheckins.length - 1) {
                            //context.res.status(200).json(notifications)
                            setTimeout(() => {

                                if(batch.size() == 0) { // Batch is empty, no notifications to be generated
                                    context.res.status(200).json({statusText: 'No Notifications'});
                                } else { // Execute the batch
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
        context.res = {
            status: 400,
            body: "Please pass an user id"
        };
        context.done();
    }
};