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
  return db.createTable('FilesGroupsPermission', {
    fileId: { type: 'binary', length: 36, notNull: true },
    groupId: { type: 'string', length: 255, notNull: true },
    permission: { type: 'datetime', notNull: true },
    hash: { type: 'string', length: 255, notNull: true },
    ownerUID: { type: 'binary', length: 36, notNull: true }
  }).then((err) => {
    if(err && err.length > 0) {
      console.error(`Cannot add column`);
      throw err;
    }  
  
    console.info(`ADDED TABLE FilesGroupsPermission`);
  });
};

exports.down = function(db) {
  return db.dropTable('FilesGroupsPermission', { ifExists: true }); 
};

exports._meta = {
  "version": 1
};
