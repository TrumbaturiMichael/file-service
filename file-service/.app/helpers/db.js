const connectionPool = require('../db');

exports.executeQuery = function executeQuery(query, params, next) {
  connectionPool.getConnection(function(err, connection) {
    if (err) {
      throw "Internal Error! " + err;
    }

    connection.query(query, params, function(err, result) {
        // if (err) {
        //   throw "Internal Error! " + err;
        // }
        
        next(err, result);
        connection.release();
    });
  });
};