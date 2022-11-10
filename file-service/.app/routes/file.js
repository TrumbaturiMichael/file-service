const fs = require('fs');
const FileModel = require('../models/file.model');
const FileException = require('../helpers/fileException');
const db = require('../helpers/db');
const hash = require('../helpers/hash');
const { randomUUID } = require('crypto');
const responseHelper = require('../helpers/http');
const FILE_PATH = process.env.FILE_PATH;

exports.get = function(request, response) {
    var userId = request.body && request.body.userId ? request.body.userId : null;
    
    if (!userId) {
        responseHelper.triggeredException(response, new FileException(401, "Unauthenticated"));
        return;
    }

    var paramsUserId = request.params && request.params.userId ? request.params.userId : null;
    var paramsUid = request.params && request.params.uid ? request.params.uid : null;
    var sqlWhere = "WHERE 1 = 1 ";

    if(paramsUserId){
        sqlWhere += `AND (Permission = 1 OR ownerUID = '${paramsUserId}')` 
        console.debug("Get files list for user request");
    } 
    else if (paramsUid) {
        sqlWhere += `AND uid = '${paramsUid}' AND (Permission = 1 OR ownerUID = '${userId}')` 
        console.debug("Get file request");
    }
    else {
        sqlWhere += `AND (Permission = 1 OR ownerUID = '${userId}')` 
        console.debug("Get files list request");
    }

    db.executeQuery(`SELECT * FROM FilesView ${sqlWhere}`, null, function(err, res) {
        if (err) {
            console.error(err);
            responseHelper.triggeredException(response, new FileException(500, "Internal error (cannot get files list)"));
            return;
        }

        response.send(res);
    });
};

exports.download = function(request, response) {
    var userId = request.body && request.body.userId ? request.body.userId : null;

    if(!userId) {
        responseHelper.triggeredException(response, new FileException(401, "Unauthenticated"));
        return;
    }

    var uid = request.params && request.params.uid ? request.params.uid : null;

    if(!uid) {
        responseHelper.triggeredException(response, new FileException(400, "File uid parameter is missing"));
        return;
    }

    console.debug("Download request: " + uid);

    const file = FILE_PATH + uid;

    db.executeQuery(`SELECT * FROM Files WHERE (Permission = 1 OR ownerUid = ?) AND uid = ?`, [userId, uid], function(err, result) {
        if (err) {
            console.error(err);
            responseHelper.triggeredException(response, new FileException(500, "Internal error (cannot get file)"));
            return;
        }

        var encryptedContent = fs.readFileSync(file);
        var decrypted = hash.decrypt(encryptedContent, result[0].ownerUID.toString().replace(/\0/g, '')).toString('utf8');

        var tempFile = FILE_PATH + result[0].originalFileName;

        fs.writeFile(tempFile, decrypted, function (err) {
            if (err) return console.error(err);

            response.download(tempFile, result[0].originalFileName);

            fs.rm(tempFile, function (err) {
                if (err) return console.error(err);
            });
        });
    });
};

exports.upload = function(request, response) {
    try {
        var userId = request.body && request.body.userId ? request.body.userId.toString() : null;
        var permission = request.body && request.body.permission ? request.body.permission.toString() : null;

        if(!userId) {
            throw new FileException(401, "Unauthenticated");
        }

        if(!request.files || !request.files.file || !request.files.file.name) {
            throw new FileException(400, "File parameter is missing");
        }

        if(!permission) {
            throw new FileException(400, "Permission parameter is missing");
        }

        console.debug("Upload request: " + request.files.file.name);

        const uuid = randomUUID();
        var file = new FileModel(uuid, request.files.file.name, new Date(), hash.getHashByBuffer(request.files.file.data), userId, permission);

        db.executeQuery('INSERT INTO Files SET ? ', file, function(err, result) {
            if (err) {
                console.error(err);
                responseHelper.triggeredException(response, new FileException(500, "Internal error (cannot save file informations)"));
                return;
            }

            fs.writeFile(FILE_PATH + uuid, hash.encrypt(request.files.file.data, userId), function (err) {
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
            });
            
            responseHelper.reply(response, "Created: " + uuid);
        });
    }
    catch (e) {
        responseHelper.triggeredException(response, e);
    }
};

exports.delete = function(request, response) {    
    var userId = request.body && request.body.userId ? request.body.userId : null;

    if(!userId) {
        responseHelper.triggeredException(response, new FileException(401, "Unauthenticated"));
        return;
    }

    var uid = request.params && request.params.uid ? request.params.uid : null;

    if(!uid) {
        responseHelper.triggeredException(response, new FileException(400, "File uid parameter is missing"));
        return;
    }

    console.debug("Delete request: " + uid);

    db.executeQuery(`DELETE FROM Files WHERE  (Permission = 1 OR ownerUid = ?) AND uid = ?`, [userId, uid], function(err, res) {
        fs.rm(FILE_PATH + uid, function (err) {
            if (err) return console.error(err);
            response.send("Deleted: " + uid);
        });
    });
};