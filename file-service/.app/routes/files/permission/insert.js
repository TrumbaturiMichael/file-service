const FileException = require('../../../helpers/fileException');
const FileRolePermissionModel = require('../../../models/fileRolePermission');
const db = require('../../../helpers/db');
const responseHelper = require('../../../helpers/http');
const permissionHelper = require('../../../constants/permission');

var ownerUserId;
var ownerRoleId;
var uid;
var permissionList;

exports.insert = function(request, response) {    
    try {
        check(request);

        console.debug("Add permission request: " + uid);

        checkPermissionAndInsert(request, response);
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

    permissionList = request.body && request.body.permission ? request.body.permission : null;

    if(!permissionList || permissionList.length == 0) {
        throw new FileException(400, "Permission parameter is missing");
    }
}

function checkPermissionAndInsert (request, response) {
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
                return insertPermissions(request, response);
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

            insertPermissions(request, response);
        }
    );
}

function insertPermissions (request, response) {
    if (permissionList && permissionList.length > 0) {
        permissionList.forEach(permission => {
            var filePermission = new FileRolePermissionModel(uid, permission.roleId, permission.userId, permission.value);
            
            db.executeQuery('INSERT INTO FilesRolesPermission SET ? ', filePermission, function(err, result) {
                if (err) {
                    console.error(err);
                    responseHelper.triggeredException(response, new FileException(500, "Internal error (cannot save file permission informations)"));
                    
                    return;
                }
            });
        });
    }
    
    responseHelper.reply(response, "Permissions added: " + uid);
}