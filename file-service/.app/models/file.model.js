class FileModel 
{
  constructor(UID, originalFileName, createdAd, hash, ownerUID) 
  {
    this.UID = UID;
    this.originalFileName = originalFileName;
    this.createdAd = createdAd;
    this.hash = hash;
    this.ownerUID = ownerUID;
  }
}

module.exports = FileModel;