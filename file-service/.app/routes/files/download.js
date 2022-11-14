const fs = require('fs');
const FileException = require('../../helpers/fileException');
const db = require('../../helpers/db');
const hash = require('../../helpers/hash');
const responseHelper = require('../../helpers/http');
const permissionHelper = require('../../constants/permission');
const FILE_PATH = process.env.FILE_PATH;

var ownerUserId;
var ownerRoleId;
var uid;

exports.download = function(request, response) {
    try{
        check(request);

        console.debug("Download request: " + uid);
        
        checkPermissionAndDownload(request, response);
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

function checkPermissionAndDownload (request, response) {
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
                return downloadFile(request, response, rows[0].ownerUID, rows[0].originalFileName);
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

            if (!permissionHelper.canExecute(permission)) {
                console.error(err);
                responseHelper.triggeredException(response, new FileException(403, "Unauthorized"));
                return;
            }

            downloadFile(request, response, rows[0].ownerUID, rows[0].originalFileName);
        }
    );
}

function downloadFile (request, response, ownerUID, originalFileName) {
    const file = FILE_PATH + uid;

    fs.promises.readFile(file).then((encryptedContent) => {
        // var encryptedContent = fs.readFileSync(file);
        var decrypted = hash.decrypt(encryptedContent, ownerUID.toString().replace(/\0/g, '')).toString('utf8');

        var tempFile = FILE_PATH + originalFileName;

        fs.writeFile(tempFile, decrypted, function (err) {
            if (err) {
                console.error(err);
                responseHelper.triggeredException(response, new FileException(500, "Internal error"));
                return;
            }

            response.download(tempFile, originalFileName);

            fs.rm(tempFile, function (err) {
                if (err) return console.error(err);
            });
        });
    }).catch((err) => {
        console.error(err)
        responseHelper.triggeredException(response, new FileException(500, "Internal error (cannot get file)"));
        return;
    });
}