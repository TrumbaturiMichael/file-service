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
  });
};

exports.down = function(db) {
  return db.removeColumn('Files', 'Permission');
};

exports._meta = {
  "version": 1
};
