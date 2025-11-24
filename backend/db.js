const mysql = require('mysql');
require('dotenv').config();


const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT

});

console.log(process.env.DB_USER, process.env.DB_PASS);


connection.connect((err) => {
  if (err) {
      console.log(err.message);
  }
  console.log('db ' + connection.state);
})

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

// Export the connection
module.exports = { connection, query };