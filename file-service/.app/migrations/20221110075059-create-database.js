'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable('Files', {
    uid: { type: 'binary', length: 36, primaryKey: true, notNull: true },
    originalFileName: { type: 'string', length: 255, notNull: true },
    createdAd: { type: 'datetime', notNull: true },
    hash: { type: 'string', length: 255, notNull: true },
    ownerUID: { type: 'binary', length: 36, notNull: true }
  }).then((err) => createFilesView(db, err));
};

function createFilesView(db, err) {
  if(err && err.length > 0) {
    console.error(`Cannot create table Files`);
    throw err;
  }  

  console.info(`TABLE Files Created`);

  return db.runSql(`
    CREATE OR REPLACE VIEW FilesView AS
    SELECT 
      CAST(uid AS CHAR(36)) AS uid,
      originalFileName,
      createdAd,
      hash,
      CAST(ownerUID AS CHAR(36)) AS ownerUID,
      Permission,
      CAST(CONCAT('http://localhost:2000${process.env.ENDPOINT}/download?uid=', uid) AS char(255)) AS downloadLink, 
      CAST(CONCAT('http://localhost:2000${process.env.ENDPOINT}/delete?uid=', uid) AS Char(255)) AS deleteLink
    FROM Files
  `, function(){
    console.info(`VIEW FilesView Created`);
  });
};


exports.down = function(db) {
  return db.runSql(`DROP VIEW IF EXISTS FilesView`, 
  function(db, err){ 
    db.dropTable('files', { ifExists: true }); 
  });
};

exports._meta = {
  "version": 1
};
