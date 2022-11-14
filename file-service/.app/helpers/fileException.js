class FileException {
  constructor(code, message) {
    this.code = code;
    this.message = message;
  }
}

module.exports = FileException;
module.exports.isFileException = function (obj) {
  return obj && obj.__proto__ && obj.__proto__.constructor && obj.__proto__.constructor == FileException;
}