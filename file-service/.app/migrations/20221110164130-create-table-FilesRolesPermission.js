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
  return db.createTable('FilesRolesPermission', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    fileId: { type: 'binary', length: 36, notNull: true, foreignKey: {
      name: 'FK_Files',
      table: 'Files',
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT'
      },
      mapping: 'uid'
    }},
    roleId: { type: 'int', notNull: false },
    userId: { type: 'int', notNull: false },
    permission: { type: 'int', notNull: true }
  }).then(function(res){
    console.info(`ADDED TABLE FilesRolesPermission`);

    db.addIndex('FilesRolesPermission', 'UX_File_Role_User', ['fileId', 'roleId', 'userId'], true)
    .then(function (res) {
      console.info(`ADDED INDEX UX_File_Role_User`);
    }, function (err) {
      if(err && err.length > 0) {
        console.error(`Cannot add index UX_File_Role_User`);
        throw err;
      }
    });
  }, function (err) {
    if(err && err.length > 0) {
      console.error(`Cannot add table FilesRolesPermission`);
      throw err;
    }
  });
};

exports.down = function(db) {
  return db.dropTable('FilesRolesPermission', { ifExists: true }); 
};

exports._meta = {
  "version": 1
};
