const { exec } = require("child_process");
const responseHelper = require('../helpers/http');

exports.diskUsage = function(request, response) {
    try{
        exec("du -sh .appData", (error, stdout, stderr) => {
            if (error) {
                console.error(error);
                responseHelper.triggeredException(response, new FileException(500, "Internal error"));
                return;
            }
            if (stderr) {
                console.error(stderr);
                responseHelper.triggeredException(response, new FileException(500, "Internal error"));
                return;
            }
            
            responseHelper.reply(response, stdout.split("\t")[0]);
            console.log(`stdout: ${stdout.split(" ")[0]}`);
            console.log(`stdout: ${stdout.split("\t")[0]}`);
        });
    } 
    catch (e) {
        responseHelper.triggeredException(response, e);
    }
};

exports.diskAvailable = function(request, response) {
    try{
        exec("df -h .appData", (error, stdout, stderr) => {
            if (error) {
                console.error(error);
                responseHelper.triggeredException(response, new FileException(500, "Internal error"));
                return;
            }
            if (stderr) {
                console.error(stderr);
                responseHelper.triggeredException(response, new FileException(500, "Internal error"));
                return;
            }
            
            responseHelper.reply(response, stdout.split("\n")[1].split("       ")[1].split("  ")[2]);
        });
    } 
    catch (e) {
        responseHelper.triggeredException(response, e);
    }
};
