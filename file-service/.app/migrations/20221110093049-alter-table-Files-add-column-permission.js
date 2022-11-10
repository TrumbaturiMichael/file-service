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
  return db.addColumn('Files', 'Permission', { type: 'string', length: 4, notNull: true }).then((err) => {
    if(err && err.length > 0) {
      console.error(`Cannot add column`);
      throw err;
    }  
  
    console.info(`ADDED COLUMN Permission ON TABLE Files`);

    return db.runSql(`
    CREATE OR REPLACE VIEW FilesView AS
    SELECT 
      *,
      CAST(CONCAT('http://localhost:2000${process.env.ENDPOINT}/download?uid=', uid) AS char(255)) AS downloadLink, 
      CAST(CONCAT('http://localhost:2000${process.env.ENDPOINT}/delete?uid=', uid) AS Char(255)) AS deleteLink
    FROM Files
  `, function(){
    console.info(`VIEW FilesView replaced`);
  });
  });
};

exports.down = function(db) {
  return db.removeColumn('Files', 'Permission');
};

exports._meta = {
  "version": 1
};
