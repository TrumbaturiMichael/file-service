const FileException = require('../../../helpers/fileException');
const db = require('../../../helpers/db');
const responseHelper = require('../../../helpers/http');
const permissionHelper = require('../../../constants/permission');

var ownerUserId;
var ownerRoleId;
var uid;
var newOwner;

exports.changeOwnership = function(request, response) {    
    try {
        check(request);

        console.debug("Change ownership request: " + uid);

        checkPermissionAndUpdate(request, response);
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

    uid = request.params && request.params.uid ? request.params.uid : null;

    if(!uid) {
        throw new FileException(400, "File uid parameter is missing");
    }
    
    newOwner = request.body && request.body.newOwner ? request.body.newOwner : null;

    if(!newOwner) {
        throw new FileException(400, "File new owner parameter is missing");
    }
}

function checkPermissionAndUpdate (request, response) {
    db.executeQuery(`SELECT  
                        CAST(ownerUID AS CHAR(36)) AS ownerUID
                    FROM 
                        Files
                    WHERE uid = ?`, [uid], 
        function(err, rows) {
            if (err) {
                console.error(err);
                responseHelper.triggeredException(response, new FileException(500, "Internal error"));
                return;
            }

            if (!rows || rows.length == 0) {
                console.error(rows);
                responseHelper.triggeredException(response, new FileException(400, "File not found"));
                return;
            }

            var isOwner = parseInt(rows[0].ownerUID) == parseInt(ownerUserId);

            if (!isOwner) {
                responseHelper.triggeredException(response, new FileException(403, "Unauthorized"));
                return;
            }

            updateFile(request, response);
        }
    );
}

function updateFile (request, response) {
    db.executeQuery(`UPDATE Files SET ownerUID = ? WHERE uid = ?`, [newOwner, uid], function(err, res) {
        if (err) {
            console.error(err);
            responseHelper.triggeredException(response, new FileException(500, "Cannot change ownership of file"));
            return;
        }
        
        responseHelper.reply(response, "Ownership changed: " + uid);
    });
}