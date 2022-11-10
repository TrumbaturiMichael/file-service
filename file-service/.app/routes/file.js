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

    if(!userId) {
        throw new FileException(401, "Unauthenticated");
    }

    console.log("Get List request");
    
    db.executeQuery('select * from FilesView', null, function(res) {
        response.send(res);
    });
};

exports.download = function(request, response) {
    var userId = request.body && request.body.userId ? request.body.userId : null;

    if(!userId) {
        throw new FileException(401, "Unauthenticated");
    }

    var uid = request.query && request.query.uid ? request.query.uid : request.body && request.body.uid ? request.body.uid : null;

    if(!uid) {
        response.send("File was not found");
        return;
    }

    console.log("Download request: " + uid);

    const file = FILE_PATH + uid;

    db.executeQuery('SELECT * FROM Files WHERE uid like \'' + uid  +'\' ', {}, function(result) {
        response.setHeader('Content-disposition', 'attachment; filename=' + result[0].originalFileName);

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

//TODO: Add files visibility
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
            throw new FileException(401, "Permission parameter is missing");
        }

        console.log("Upload request: " + request.files.file.name);

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
        throw new FileException(401, "Unauthenticated");
    }

    var uid = request.query && request.query.uid ? request.query.uid : request.body && request.body.uid ? request.body.uid : null;

    if(!uid) {
        response.send("File was not found");
        return;
    }

    console.log("Delete request: " + uid);

    db.executeQuery('DELETE FROM Files WHERE uid = ?' , uid, function(res) {
        fs.rm(FILE_PATH + uid, function (err) {
            if (err) return console.error(err);
            response.send("Deleted: " + uid);
        });
    });
};