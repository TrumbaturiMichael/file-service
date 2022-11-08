const fs = require('fs');
const fileModel = require('../models/file.model');
const db = require('../helpers/db');
const hash = require('../helpers/hash');
const { randomUUID } = require('crypto');
const FILE_PATH = process.env.FILE_PATH;

exports.upload = function(request, response){    
    if(!request.files || !request.files.file || !request.files.file.name) {
        response.send("File was not found");
        return;
    }

    console.log("Upload request: " + request.files.file.name);
    const uuid = randomUUID();

    var file = new fileModel(uuid, request.files.file.name, new Date(), hash.getHashByBuffer(request.files.file.data), request.body.ownerUUID);
    db.executeQuery('INSERT INTO Files SET ? ', file, function(result)
    {
        fs.writeFile(FILE_PATH + uuid, hash.encrypt(request.files.file.data, request.body.ownerUUID)/*.toString('base64')*/, function (err) {
            if (err) return console.log(err);
        });
    });

    response.send("Created: " + uuid);
};

exports.download = function(request, response){
    if(!request.query || !request.query.uid)
    {
        response.send("File was not found");
        return;
    }

    console.log("Download request: " + request.query.uid);

    const file = FILE_PATH + request.query.uid;

    db.executeQuery('SELECT * FROM Files WHERE uid like \'' + request.query.uid  +'\' ', {}, function(result)
    {
        response.setHeader('Content-disposition', 'attachment; filename=' + result[0].originalFileName);

        var encryptedContent = fs.readFileSync(file);
        var decrypted = hash.decrypt(encryptedContent, result[0].ownerUID.toString().replace(/\0/g, '')).toString('utf8');

        var tempFile = FILE_PATH + result[0].originalFileName;

        fs.writeFile(tempFile, decrypted, function (err) {
            if (err) return console.log(err);

            response.download(tempFile, result[0].originalFileName);

            fs.rm(tempFile, function (err) {
                if (err) return console.log(err);
            });
        });
    });
};

exports.getList = function(request, response){
    console.log("Get List request");
    db.executeQuery('select * from FilesView', null, function(res){
        response.send(res);
    });
};

exports.delete = function(request, response){
    if(!request.query || !request.query.uid)
    {
        response.send("File was not found");
        return;
    }

    console.log("Delete request: " + request.query.uid);

    db.executeQuery('DELETE FROM Files WHERE uid = ?' , request.query.uid, function(res){
        fs.rm(FILE_PATH + request.query.uid, function (err) {
            if (err) return console.log(err);
            response.send("Deleted: " + request.query.uid);
        });
    });
};