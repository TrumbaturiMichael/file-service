const mysql = require('mysql2');

var connectionPoolParameters = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_ROOT_USER,
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQL_DB
}
var connectionPool = mysql.createPool(connectionPoolParameters);

connectionPool.getConnection(function(err, connection) {
    if (err) {
      if(err.code == 'ER_BAD_DB_ERROR') {
        delete connectionPoolParameters['database'];
        var createDbConnectionPool = mysql.createPool(connectionPoolParameters);
      
        createDbConnectionPool.getConnection(function(err, createDbConnection) {
          if (err) throw err;

          createDatabaseIfNotExists(createDbConnection, function() {
            createDbConnection.release();
          });
        });
      }
      else {
        throw err;
      }
    }
    else {
      createTableIfNotExists(connection, function() {
        createViewIfNotExists(connection, function() {
          connection.release();
        });
      });
    }
});

function createDatabaseIfNotExists(dbConnection, next) {
  dbConnection.query("CREATE DATABASE " + process.env.MYSQL_DB, function (err, result) {
    if (err) throw err;

    console.log("DATABASE " + process.env.MYSQL_DB + " Created!");

    createTableIfNotExists(dbConnection, function() {
      createViewIfNotExists(dbConnection,  function() {
        next();
      });
    });
  });
};

function createTableIfNotExists(dbConnection, next) {
  dbConnection.query("CREATE TABLE if not exists Files (uid binary(36) NOT NULL, originalFileName NVARCHAR(255) NOT NULL, createdAd datetime NOT NULL, hash NVARCHAR(255) NOT NULL, ownerUID binary(36) NOT NULL, PRIMARY KEY (uid))");

  console.log("TABLE Files Created or already exists!");

  next();
};

function createViewIfNotExists(dbConnection, next) {
  dbConnection.query(`
    CREATE OR REPLACE VIEW FilesView AS
    SELECT 
      originalFileName, 
      createdAd, 
      CAST(CONCAT('http://localhost:2000${process.env.ENDPOINT}/download?uid=', uid) AS char(255)) AS downloadLink, 
      CAST(CONCAT('http://localhost:2000${process.env.ENDPOINT}/delete?uid=', uid) AS Char(255)) AS deleteLink
    FROM Files
  `);

  console.log("VIEW FilesView Created or already exists!");

  next();
};

module.exports = connectionPool;