const FileException = require("./fileException");

exports.reply = function(response, msg) {
    var code = 200;
    var message = {};

    if(msg) {
        if (msg.code) {
            code = msg.code;
        }

        if (msg.body) {
            message = msg.body;
        } 
        else if (msg.message) {
            message = msg.message;
        } 
        else {
            message = msg;
        }
    }

    if (!message) {
        code = 204; //No Content
    }

    response.status(code).send(message);
}

exports.triggeredException = function (response, e) {
    var error = e;
  
    if(!FileException.isFileException(error)) {
        error = new FileException(500, e);
    }
  
    responseHelper.reply(response, error);
}