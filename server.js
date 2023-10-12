const express = require("express");
const app     = express();

const Database = require("./Database");
const table    = "cities"
const db       = new Database(table);

const PORT = 5555;

/**
 * This route execute the process of inserting the cities CSV file into the rows
 * of the sqlite table.
*/
app.get(`/insertCSV`, (req, res) => {
    db.insertCSVData()
        .then(() => {
            res.send(`Success`);
        }).catch(err => {
            res.send(`Error`);
        });
});

/**
 * This route queries one city and state given the parameters passed into the URL.
 */
app.get(`/api/population/state/:state/city/:city`, (req, res) => {
    const { city, state } = req.params;

    db.getRow(city, state)
        .then((result) => {
            let responseMsg, responseStatus;

            if(result){
                responseMsg    = result;
                responseStatus = 200;
            } else {
                responseMsg    = `No city/state found for ${city}, ${state}.`
                responseStatus = 400;
            }
            res.status(responseStatus);
            res.json(responseMsg);
        })
        .catch(() => {
            res.status(500);
            res.send(`There's been an error while trying to find the city/state you've provided.`);
        })
})

/**
 * This route allows the user to insert a new row with city/state/population values into the sqlite table.
 */
app.put(`/api/population/state/:state/city/:city/population/:population`, (req, res) => {
    let { state, city, population } = req.params;
    city  = city.replace(city[0], city[0].toUpperCase());
    state = state.replace(state[0], state[0].toUpperCase());
    
    db.insertRow([city, state, population])
        .then((operation) => {
            let responseMsg, responseStatus;
            
            switch(operation){
                case db.operations.INSERT:
                    responseStatus = 201;
                    responseMsg    = `Successfully inserted row with values: ${city}, ${state}, ${population}.`;
                    break;
                case db.operations.UPDATE:
                    responseStatus = 200;
                    responseMsg    = `Successfully updated row with values: ${city}, ${state}, ${population}.`;
                    break;
                }
                res.status(responseStatus);
                res.send(population);
            })
        .catch(() => {
            res.status(400);
            res.send(`Failure while inserting row with values: ${city}, ${state}, ${population}.`);
        });
})

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`)
})
