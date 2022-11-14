const FileException = require('../../helpers/fileException');
const db = require('../../helpers/db');
const responseHelper = require('../../helpers/http');
const permissionHelper = require('../../constants/permission');

var ownerUserId;
var ownerRoleId;
var uid;
var name;

exports.rename = function(request, response) {    
    try {
        check(request);

        console.debug("Rename request: " + uid);

        checkPermissionAndRename(request, response);
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
    
    name = request.body && request.body.name ? request.body.name : null;

    if(!name) {
        throw new FileException(400, "File name parameter is missing");
    }
}

function checkPermissionAndRename (request, response) {
    db.executeQuery(`SELECT  
	                    ownerUID, userId, roleId, permission
                    FROM 
                        FilesView
                    WHERE uid = ? AND (ownerUID = ? OR ((userId IS NULL OR userId = ?) AND (roleId IS NULL OR roleId = ?)))`, [uid, ownerUserId, ownerUserId, ownerRoleId], 
        function(err, rows) {
            if (err) {
                console.error(err);
                responseHelper.triggeredException(response, new FileException(500, "Internal error"));
                return;
            }

            if (!rows || rows.length == 0) {
                console.error(err);
                responseHelper.triggeredException(response, new FileException(400, "File not found"));
                return;
            }

            var isOwner = parseInt(rows[0].ownerUID) == parseInt(ownerUserId);

            if (isOwner) {
                return renameFile(request, response);
            }
            
            var permissionRole = null;
            var permissionUser = null;

            for (var i in rows) {
                if (!rows[i].permission)
                {
                    continue;
                }

                if (rows[i].roleId) {
                    permissionRole = rows[i].permission;
                }
                
                if (rows[i].userId) {
                    permissionUser = rows[i].permission;
                }
            }

            var permission = permissionUser ?? permissionRole ?? permissionHelper.n;

            if (!permissionHelper.canWrite(permission)) {
                console.error(err);
                responseHelper.triggeredException(response, new FileException(403, "Unauthorized"));
                return;
            }

            renameFile(request, response);
        }
    );
}

function renameFile (request, response) {
    db.executeQuery(`UPDATE Files SET originalFileName = ? WHERE uid = ?`, [name, uid], function(err, res) {
        if (err) {
            console.error(err);
            responseHelper.triggeredException(response, new FileException(500, "Cannot rename file"));
            return;
        }
        
        responseHelper.reply(response, "Renamed: " + uid);
    });
}