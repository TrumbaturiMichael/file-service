const express = require('express');
const fileupload = require("express-fileupload");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config({path: './.config/.env'});
const Claim = require('./helpers/claim');
const fileRoute = require('./routes/file');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileupload());

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;
const ENDPOINT = process.env.ENDPOINT || '/files';

app.listen(PORT, HOST, () => {
    console.log(`${process.env.NAME} is starting`);
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
        
        next();
    } else {
        return res.sendStatus(503); //return res.status(401).send("Access Denied");
    }
})

app.post(ENDPOINT + '/upload', fileRoute.upload);
app.get(ENDPOINT + '/download', fileRoute.download);
app.get(ENDPOINT + '/getList', fileRoute.getList);
app.delete(ENDPOINT + '/delete', fileRoute.delete);

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