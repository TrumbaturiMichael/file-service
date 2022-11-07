const express = require('express');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

app.get('/Get', function (req, res) {
    res.send('GET request without auth received');
});

app.get('/GetAuth', function (req, res) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    if (token == null) return res.sendStatus(401);
    
    const verified = jwt.verify(token, jwtSecretKey);
    
    if(verified){
        return res.send('GET request authorized received');
    }else{
        console.log(`error ${error}`);
        return res.status(401).send("Access Denied");
    }
});

app.listen(PORT, HOST, () => {
    console.log(`Running on http://${HOST}:${PORT}`);
}); 