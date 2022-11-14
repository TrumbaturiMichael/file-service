const mysql = require('mysql2');
const dbmigrate = require('db-migrate');

var connectionPoolParameters = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_ROOT_USER,
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQL_DB
}

var connectionPool = mysql.createPool(connectionPoolParameters);
var dbm = dbmigrate.getInstance(true, {
  config: './database.json',
  env: 'prod'
});

connectionPool.getConnection(function(err, connection) {
  console.info("Starting database migrations!");

  if (err) {
    if(err.code == 'ER_BAD_DB_ERROR') {
      var connectionPoolDB = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_ROOT_USER,
        password: process.env.MYSQL_ROOT_PASSWORD
      });

      connectionPoolDB.getConnection(function(err, connectionDB) {
        connectionDB.query(`CREATE DATABASE ${process.env.MYSQL_DB}`, function(err, result) {
          if (err) throw err;
          connectionDB.release();
          dbm.up();
        });
      });
    }
    else {
      throw err;
    }
  }
  else {
    connection.release();
    dbm.up();
  }
});

module.exports = connectionPool;