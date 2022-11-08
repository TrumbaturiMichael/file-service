const connectionPool = require('../db');

exports.executeQuery = function executeQuery(query, params, fnSuccess)
{
  connectionPool.getConnection(function(err, connection) {
    if (err) 
    {
      throw "Internal Error! " + err;
        //response.sendStatus(500).send("Internal Error!").end();
        return;
    }

    connection.query(query, params, function(err, result) {
        if (err) 
        {
            throw "Internal Error! " + err;
            //response.sendStatus(500).send("Internal Error!").end();
            connection.release();
            return;
        }
        
        fnSuccess(result);
        connection.release();
    });
  });
};