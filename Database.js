const fs        = require("fs");
const sqlite3   = require("sqlite3").verbose();
const { parse } = require("csv-parse");


class Database{
  constructor(table){
    this.db;
    this.table      = table;
    this.operations = {
      INSERT: `INSERT`,
      UPDATE: `UPDATE`
    }
    this.connectToDatabase()
  }
  
/**
 * This method connects to the table passed as a parameter to the object constructor.
 * If the table doesn't exist then it will get created before connecting to it.
 * @returns this
 */
connectToDatabase() {
  const filepath  = `./cities.db`;
  
  if (!fs.existsSync(filepath)) {
    fs.appendFile(filepath, "", function(error) {
      if(error) throw error;

      console.log(`Created database ${filepath}!`)
    })
  }

  this.db = new sqlite3.Database(filepath);

  this.createTable()

  return this; 
}

/**
 * This method creates the table defined in the constructor.
 */
createTable() {
  const {db, table} = this;
  
  this.db.get(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name = '${table}' 
  `, function(error, row){
    if(error) throw error;
    
    if(row == undefined){
      db.exec(`
       CREATE TABLE ${table}
       (
         city       VARCHAR(50),
         state      VARCHAR(20),
         population INT
       )
    `);
    }
  });
 }

/**
 * This method queries the table to search for a row by city/state.
 * @param {string} city 
 * @param {string} state 
 * @returns Promise
 */
getRow(city, state){
  // Capitalize the first letter of the city and state
  city  = city.replace(city[0], city[0].toUpperCase());
  state = state.replace(state[0], state[0].toUpperCase());
  
  return new Promise((resolve, reject) => this.db.all(`
     SELECT * 
     FROM ${this.table} 
     WHERE city = "${city}" AND state = "${state}" 
     ORDER BY state
   `, [], (err, [{population}]) => {
     if(err) reject(err);

     resolve(population);
    })
  )}
 
/**
 * This method inserts the values from the data.csv file into the table.
 */
insertCSVData(){
  const {db, table} = this;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(`./data.csv`)
      .pipe(parse({ delimiter: `,`, from_line: 2 }))
      .on(`data`, function(row){
        db.serialize(function(){
          db.run(`
            INSERT INTO ${table} 
            VALUES (?, ?, ?)`,
            row,
            function(error) {
              if(error) {
               console.log(error.message);
               reject();
              }
              console.log(`Inserted a row with the id: ${this.lastID}`);
            }
          )
        })
      })
      resolve();
  })
 }

 /**
  * This methods inserts a row into the table 
  * @param {array} data [city, state, population]
  * @returns 
  */
 insertRow(data){
  const {db, table, operations} = this;

  
  return new Promise((resolve, reject) => {
    
    this.db.get(`
      SELECT *
      FROM ${this.table}
      WHERE city = '${data[0]}' 
    `, function(error, row){

      if(error) reject(error);

      if(row == undefined){

        db.serialize(function(){
          db.run( `
            INSERT INTO ${table} 
            VALUES (?, ? ,?)
          `, data, function(error){
            if(error){
              console.log(error.message)
              reject(operations.INSERT);
            }
            console.log(`Inserted a row with the id: ${this.lastID}`);
            resolve(operations.INSERT);
          })
        })

      } else {
        db.run(`
          UPDATE ${table} 
          SET city = ?, state = ?, population = ?
          WHERE city = ? AND state = ?
        `, data, function(error){
          if(error){
            console.log(error.message)
            reject(operations.UPDATE);
          }
          console.log(`Inserted a row with the id: ${this.lastID}`);
          resolve(operations.UPDATE);
        })
      }

    })

  })
}

}

module.exports = Database;