const FileException = require('../../../helpers/fileException');
const db = require('../../../helpers/db');
const responseHelper = require('../../../helpers/http');
const permissionHelper = require('../../../constants/permission');

var ownerUserId;
var ownerRoleId;
var uid;

exports.get = function(request, response) {    
    try {
        check(request);

        console.debug("Get permission request: " + uid);

        checkPermissionAndGet(request, response);
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
}

function checkPermissionAndGet (request, response) {
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
                return getPermission(request, response);
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

            if (!permissionHelper.canRead(permission)) {
                console.error(err);
                responseHelper.triggeredException(response, new FileException(403, "Unauthorized"));
                return;
            }

            getPermission(request, response);
        }
    );
}

function getPermission (request, response) {
    db.executeQuery(`
        SELECT NULL AS roleId, CAST(ownerUID AS CHAR(36)) AS userId, 8 AS permissionCode FROM Files WHERE uid = ? 
        UNION ALL
        SELECT roleId, userId, permission as permissionCode FROM FilesRolesPermission WHERE fileId = ?`, [uid, uid], 
    function(err, rows) {
        if (err) {
            console.error(err);
            responseHelper.triggeredException(response, new FileException(500, "Cannot get file permission"));
            return;
        }

        for (var i in rows) {
            rows[i].permission = permissionHelper.permission[rows[i].permissionCode];
        }
        
        responseHelper.reply(response, rows);
    });
}