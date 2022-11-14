const fs = require('fs');
const FileModel = require('../../models/file');
const FileRolePermissionModel = require('../../models/fileRolePermission');
const FileException = require('../../helpers/fileException');
const db = require('../../helpers/db');
const hash = require('../../helpers/hash');
const { randomUUID } = require('crypto');
const responseHelper = require('../../helpers/http');
const FILE_PATH = process.env.FILE_PATH;

var ownerUserId;
var ownerRoleId;
var permissionList;

exports.upload = function(request, response) {
    try {
        check(request);

        console.debug("Upload request: " + request.files.file.name);

        insertFile(request, response);       
    }
    catch (e) {
        responseHelper.triggeredException(response, e);
    }
};

function check (request) {
    ownerUserId = request.body && request.body.ownerUserId ? request.body.ownerUserId.toString() : null;
    ownerRoleId = request.body && request.body.ownerRoleId ? request.body.ownerRoleId.toString() : null;

    permissionList = request.body && request.body.permission ? JSON.parse(request.body.permission) : null;

    if(!ownerUserId) {
        throw new FileException(401, "Unauthenticated");
    }

    if(!request.files || !request.files.file || !request.files.file.name) {
        throw new FileException(400, "File parameter is missing");
    }
}

function insertFile (request, response) {
    const uuid = randomUUID();
    var file = new FileModel(uuid, request.files.file.name, new Date(), hash.getHashByBuffer(request.files.file.data), ownerUserId);

    db.executeQuery('INSERT INTO Files SET ? ', file, function(err, result) {
        if (err) {
            console.error(err);
            responseHelper.triggeredException(response, new FileException(500, "Internal error (cannot save file informations)"));
            
            return;
        }

        writeFile(request, response, uuid);
    });
}

function writeFile (request, response, uuid) {
    fs.writeFile(FILE_PATH + uuid, hash.encrypt(request.files.file.data, ownerUserId), function (err) {
        if (err) {
            console.error(err);
            db.executeQuery('DELETE FROM Files WHERE uid = ?', uuid, function(err, result) {
                if (err) {
                    console.error(err);
                    responseHelper.triggeredException(response, new FileException(500, "Internal error (cannot delete file informations for not written file)"));
                    return;
                }
            });

            responseHelper.triggeredException(response, new FileException(500, "Cannot write file"));
            return;
        }

        insertPermissions(request, response, uuid);
    });
}

function insertPermissions (request, response, uuid) {
    if (permissionList && permissionList.length > 0) {
        permissionList.forEach(permission => {
            var filePermission = new FileRolePermissionModel(uuid, permission.roleId, permission.userId, permission.value);
            
            db.executeQuery('INSERT INTO FilesRolesPermission SET ? ', filePermission, function(err, result) {
                if (err) {
                    console.error(err);
                    responseHelper.triggeredException(response, new FileException(500, "Internal error (cannot save file permission informations)"));
                    
                    return;
                }
                
                //responseHelper.reply(response, "Created: " + uuid);
            });
        });
    }
    
    responseHelper.reply(response, "Created: " + uuid);
}