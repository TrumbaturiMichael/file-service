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
  return db.runSql(`
  CREATE OR REPLACE VIEW FilesView AS
    SELECT 
    CAST(uid AS CHAR(36)) AS uid,
    originalFileName,
    createdAt,
    hash,
    CAST(ownerUID AS CHAR(36)) AS ownerUID,
      FRP.userId,
      FRP.roleId,
      FRP.permission
    FROM 
      Files AS F
      LEFT OUTER JOIN FilesRolesPermission FRP ON F.uid = FRP.fileId
`, function(){
  console.info(`VIEW FilesView Created`);
});
};

exports.down = function(db) {
  return db.runSql(`DROP VIEW IF EXISTS FilesView`);
};

exports._meta = {
  "version": 1
};
