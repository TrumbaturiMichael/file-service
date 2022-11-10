const connectionPool = require('../db');

exports.executeQuery = function executeQuery(query, params, next) {
  connectionPool.getConnection(function(err, connection) {
    if (err) {
      throw "Internal Error! " + err;
    }

    connection.query(query, params, function(err, result) {        
        next(err, result);
        connection.release();
    });
  });
};