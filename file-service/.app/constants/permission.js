module.exports.n = 0;
module.exports.x = 1; //execute (download)
module.exports.w = 2; //write (delete)
module.exports.wx = 3; //execute & write
module.exports.r = 4; //read (get)
module.exports.rx = 5; //read & execute
module.exports.rw = 6; //read & write
module.exports.rwx = 7; //read & execute & write

module.exports.permission = ["n", "x", "w", "wx", "r", "rx", "rw", "rwx", "owner"];
module.exports.permissionObj = {n: this.n, x: this.x, w: this.w, wx: this.wx, r: this.r, rx: this.rx, rw: this.rw, rwx: this.rwx}; 

module.exports.canExecute = function (permission) {
    return [this.x, this.wx, this.rwx].includes(permission);
}

module.exports.canWrite = function (permission) {
    return [this.w, this.wx, this.rwx].includes(permission);
}

module.exports.canRead = function (permission) {
    return [this.r, this.rx, this.rw, this.rwx].includes(permission);
}