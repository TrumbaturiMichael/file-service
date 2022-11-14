const fs = require('fs');
const FileException = require('../helpers/fileException');
const db = require('../helpers/db');
const responseHelper = require('../helpers/http');
const { default: axios } = require('axios');
const FILE_PATH = process.env.FILE_PATH;

var ownerUserId;
var ownerRoleId;
var uid;
var userId;
var roleId;

exports.get = function(request, response) {
    try{
        check(request);

        composeQuery(request, response);
    } 
    catch (e) {
        responseHelper.triggeredException(response, e);
    }
};

function check (request) {

    ownerUserId = request.body && request.body.ownerUserId ? request.body.ownerUserId.toString() : null;
    ownerRoleId = request.body && request.body.ownerRoleId ? request.body.ownerRoleId.toString() : null;

    if(!ownerUserId) {
        throw new FileException(401, "Unauthenticated");
    }

    userId = request.params && request.params.userId ? request.params.userId : null;
    roleId = request.params && request.params.roleId ? request.params.roleId : null;
    uid = request.params && request.params.uid ? request.params.uid : null;
}

function composeQuery (request, response) {
    var fields = ' uid, originalFileName, createdAd, hash, ownerUID ';
    var sqlQuery = `SELECT ${fields} FROM FilesView WHERE 1 = 1 `;
    
    //TODO add request to user service to get users role and filter also files he can see by his role
    if (userId) {
        // axios.get('http://ztm-gateway:2000/users/' + userId)
        // .then(response => {
        //     console.log(response.data);
        //     console.log(sqlQuery);
            
            //all files owned by selected user or file for which selected user has read permission
            sqlQuery += `AND (ownerUID = '${userId}' OR (Permission >= 4 AND userId = ${userId}))` 
            sqlQuery += ` GROUP BY ${fields}`;
            console.debug("Get files list for user request");
            return executeQuery(request, response, sqlQuery);
        // })
        // .catch(error => {
        //     console.log(error);
        // });
        // return;
    } 
    
    if (roleId) {
        //all files for which selected role has read permission
        sqlQuery += `AND Permission >= 4 AND roleId = ${roleId}` 
        sqlQuery += ` GROUP BY ${fields}`;
        console.debug("Get file for role request");
        return executeQuery(request, response, sqlQuery);
    }
    
    //all files owned by request user, all files for which request user have read permission or all files for which request user is of permitted role
    sqlQuery = `
        SELECT 
            ${fields}
        FROM 
            FilesView
        WHERE
            /*All files owned by me*/ 
            (ownerUID = '${ownerUserId}'
            /*All files visible by me*/
            OR (
                userId = ${ownerUserId} 
                AND Permission >= 4 
            )
            /*All files visible by my group that it's not blocked for me*/
            OR (
                roleId = ${ownerRoleId} 
                AND Permission >= 4 
                AND uid NOT IN (
                    SELECT uid FROM FilesView WHERE userId = ${ownerUserId} AND Permission < 4 
                )
            ))
    `;
    
    if (uid) {
        //selected file only if request user is owner, have read permission or is of permitted role
        sqlQuery += ` AND uid = '${uid}'`;
        sqlQuery += ` GROUP BY ${fields}`;
        console.debug("Get file request");
        return executeQuery(request, response, sqlQuery);
    }

    sqlQuery += ` GROUP BY ${fields}`;
    console.debug("Get files list request");
    return executeQuery(request, response, sqlQuery);
}

function executeQuery (request, response, sqlQuery) {
    db.executeQuery(sqlQuery, null, function(err, rows) {
        if (err) {
            console.error(err);
            responseHelper.triggeredException(response, new FileException(500, "Internal error (cannot get files list)"));
            return;
        }

        if (!rows || rows.length == 0) {
            console.error(err);
            responseHelper.triggeredException(response, new FileException(400, "File not found"));
            return;
        }
        
        if(uid) {
            var result = rows[0];
            fs.promises.stat(FILE_PATH + uid).then((fileStats) => {
                Object.assign(result, fileStats);
                responseHelper.reply(response, result);
            });
        }
        else {
            responseHelper.reply(response, rows);
        }
    });
}