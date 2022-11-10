const express = require('express');
const fileupload = require("express-fileupload");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config({path: './.config/.env'});
const Claim = require('./helpers/claim');
const { reset, blue, red, yellow } = require('./constants/consoleColor');
const fileRoute = require('./routes/file');
const app = express();

//#region CONSOLE

(function(){
    var _log = console.log;
    var _info = console.info;
    var _warn = console.warn;
    var _error = console.error;
  
    console.debug = function(message){
        message = `[DEBUG] - ${message}`;
        if(process.env.DEBUG)
            _log.apply(console,arguments);
    };

    console.log = function(message){
        if(process.env.DEBUG)
            _log.apply(console,arguments);
    };

    console.info = function(message){
        message = `${blue}[INFO] - ${message}${reset}`;
        if(process.env.DEBUG)
            _info.apply(console,arguments);
    };
    
    console.warn = function(message){
        message = `${yellow}[WARNING] - ${message}${reset}`;
        _warn.apply(console,arguments);
    };

    console.error = function(message){
        message = `${red}[ERROR] - ${message}${reset}`;
       _error.apply(console,arguments);
    };    
})();

//#endregion CONSOLE

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileupload());

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;
const ENDPOINT = process.env.ENDPOINT || '/files';

app.listen(PORT, HOST, () => {
    console.info(`${process.env.NAME} is starting`);
}); 

//Application middleware to manage authorization
app.use((req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    if (token == null) return res.sendStatus(503); //401

    const verified = jwt.verify(token, jwtSecretKey);

    if (verified) {
        var decodedToken = jwt.decode(token);

        var claim = new Claim(decodedToken.data);
        claim.reduceHop();
        claim.setService(process.env.NAME);

        res.authorization = jwt.sign({data: claim, exp: decodedToken.exp}, jwtSecretKey);

        if(req.url == "/") {
            return res.sendStatus(200);
        }

        if(claim.isAuthenticated()) {
            req.body.userId = claim.getUserId();
        }
        
        next();
    } else {
        return res.sendStatus(503); //return res.status(401).send("Access Denied");
    }
})

// GET /files get all owned file and all public file
app.get(ENDPOINT, fileRoute.get);

// GET /files/user/:userId get all file visible by the parameter user (public and owned by him)
app.get(ENDPOINT + '/user/:userId', fileRoute.get);

//GET /files/:uid to get file info
app.get(ENDPOINT + '/:uid', fileRoute.get);

//GET /files/:uid/download
app.get(ENDPOINT + '/:uid/download', fileRoute.download);

//POST /files/upload
app.post(ENDPOINT + '/upload', fileRoute.upload);

//DELETE /files/:id
app.delete(ENDPOINT + '/:id', fileRoute.delete);

app.on('error', onError);
app.on('listening', onListening);

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
        default:
            throw error;
    }
}

function onListening() {
    if (process.env.MYSQL_HOST == null || process.env.MYSQL_USER == null || process.env.MYSQL_ROOT_PWD == null || process.env.MYSQL_DB == null)
        throw new Error("DB connection unset!")

    var addr = app.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
}