const crypto = require('crypto');
const algorithm = 'aes-256-ctr';

exports.getHashByBuffer = function (buffer) {
    const hashSum = crypto.createHash('sha256');
    hashSum.update(buffer);
    return hashSum.digest('hex');
};

function getCipherKey (password) {
    return crypto.createHash('sha256').update(password).digest();
};

exports.encrypt = function(buffer, password) {
    // Create an initialization vector
    const iv = crypto.randomBytes(16);
    const key = getCipherKey(password);

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    // Create the new (encrypted) buffer
    const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);

    return result;
}

exports.decrypt = function(encrypted, password) {    
    // Get the iv: the first 16 bytes
    const iv = encrypted.slice(0, 16);
    const key = getCipherKey(password);

    encrypted = encrypted.slice(16);

    // Create a decipher
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    // Actually decrypt it
    const result = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return result;
}