class FileModel {
  constructor(UID, originalFileName, createdAd, hash, ownerUID, permission) {
    this.UID = UID;
    this.originalFileName = originalFileName;
    this.createdAd = createdAd;
    this.hash = hash;
    this.ownerUID = ownerUID;
    this.permission = permission;
  }
}

module.exports = FileModel;