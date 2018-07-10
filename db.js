'use strict';

const idb = require('./idb.js');

/**
 * An object representing an idb store schema.
 *
 * @typedef {Object} Schema
 * @property {Object} create
 * @property {String} create.name
 * @property {Object} create.options
 * @property {Object} index
 * @property {String} index.name
 * @property {String} index.property
 * @property {Object} index.options
 */

/**
 * Class representing an IDBDatabase object.
 *
 * @constructor
 * @param {String} dbName
 * @param {Number} version
 * @returns {DB}
 */
class DB {
  constructor(dbName, version) {
    this.dbName = dbName;
    this.version = version;
    this.dbPromise = null;
  }

  /**
   * Opens a connection to the database.
   *
   * @param {String} dbName
   * @param {Number} version
   * @returns {Promise}
   */
  open() {
    this.dbPromise = idb.open(this.dbName, this.version);
    return this.dbPromise;
  }

  /**
   * Creates a new database and schema structure.
   *
   * @param {String} dbName
   * @param {Number} version
   * @param {Schema[]}
   * @returns {Promise}
   */
  static createDatabase(dbName, version, schemas) {
    return idb.open(dbName, version, upgradeDB => {
      let store = null;
      schemas.forEach(schema => {
        if (!upgradeDB.objectStoreNames.contains(schema.create.name)) {
          store = upgradeDB.createObjectStore(schema.create.name, schema.create.options);
          if (schema.hasOwnProperty('index')) {
            store.createIndex(schema.index.name, schema.index.property, schema.index.options);
          }
        }
      });
    })
    .then(db => {
      return db.close();
    });
  }

  /**
   * Deletes a database.
   *
   * @param {String} dbName
   * @returns {Promise}
   */
  static deleteDatabase(dbName) {
    return idb.delete(dbName);
  }

  /**
   * Checks if indexedDB is supported.
   *
   * @static
   * @readonly
   * @returns {Boolean}
   */
  static get hasSupport() {
    if (!('indexedDB' in window)) {
      console.warn('This environment doesn\'t support IndexedDB');
      return false;
    }
    return true;
  }

  /**
   * Fired when a database structure change.
   *
   * @listens IDBOpenDBRequest.onupgradeneeded | IDBFactory.deleteDatabase
   * @returns {Promise}
   */
  onversionchange() {
    if (!this.dbPromise) {
      return connectionError();
    }
    return new Promise((resolve, reject) => {
      return this.dbPromise.then(db => {
        db._db.onversionchange = function(err) {
          resolve(err);
        };
      });
    });
  }

  /**
   * Fired after all transactions have been aborted and the connection has been closed.
   *
   * @listens close
   * @returns {Promise}
   */
  onclose() {
    if (!this.dbPromise) {
     return connectionError();
    }
    return new Promise((resolve, reject) => {
      return this.dbPromise.then(db => {
        db._db.onclose = function(err) {
          resolve(err);
        };
      });
    });
  }

  /**
   * Fired when a request returns an error and bubbles up to the connection object.
   *
   * @listens error
   * @returns {Promise}
   */
  onerror() {
    if (!this.dbPromise) {
      return connectionError();
    }
    return new Promise((resolve, reject) => {
      return this.dbPromise.then(db => {
        db._db.onerror = function(err) {
          resolve(err);
        };
      });
    });
  }

  /**
   * Fired when a transaction is aborted and bubbles up to the connection object.
   *
   * @listens abort
   * @returns {Promise}
   */
  onabort() {
    if (!this.dbPromise) {
      return connectionError();
    }
    return new Promise((resolve, reject) => {
      return this.dbPromise.then(db => {
        db._db.onabort = function(err) {
          resolve(err);
        };
      });
    });
  }

  /**
   * Returns the db name.
   *
   * @returns {Promise}
   */
  get name() {
    if (!this.dbPromise) {
      return connectionError();
    }
    return this.dbPromise.then(db => {
      return db.name;
    });
  }

  /**
   * Returns the db version.
   *
   * @returns {Promise}
   */
  get version() {
    if (!this.dbPromise) {
      return connectionError();
    }
    return this.dbPromise.then(db => {
      return db.version;
    });
  }

  /**
   * Returns all store names.
   *
   * @returns {Promise}
   */
  get objectStoreNames() {
    if (!this.dbPromise) {
      return connectionError();
    }
    return this.dbPromise.then(db => {
      let names = db.objectStoreNames;
      let buffer = [];
      for (var i = 0; i < names.length; i++) {
        buffer.push(names[i]);
      }
      return buffer;
    });
  }

  /**
   * Closes connection to the db.
   *
   * @returns {Promise}
   */
  close() {
    if (!this.dbPromise) {
      return connectionError();
    }
    return this.dbPromise
      .then(db => {
        return db.close();
      })
      .then(() => {
        this.dbPromise = null;
      });
  }

  /**
   * Returns a transaction object(IDBTransaction).
   *
   * @param {String[]|IDBDatabase.objectStoreNames} [storeNames]
   * @param {String} [mode]
   * @returns {Promise}
   */
  transaction(storeNames, mode) {
    return this.dbPromise.then(db => {
      return db.transaction(storeNames, mode);
    });
  }

}

/**
 * Returns a connection error.
 *
 * @returns {Promise}
 */
function connectionError() {
  return Promise.reject(new Error('Connection not open.'));
}

module.exports = DB;
