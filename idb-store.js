'use strict';

var idb = require('./idb.js');

/**
 * Class representing a IndexedDB objectStore.
 *
 * @constructor
 * @param {String} storeKey
 * @param {Promise} dbPromise
 * @returns {Store}
 */
class Store {
  constructor(storeKey, dbPromise) {
    this.dbPromise = dbPromise;
    this.storeKey = storeKey;
  }

  /**
   * Retrives a record or a range of records from the store.
   *
   * @param {Key|IDBKeyRange} key
   * @returns {Promise}
   */
  get(key) {
    return this.dbPromise.then(db => {
      return db.transaction(this.storeKey)
        .objectStore(this.storeKey).get(key);
    });
  }

  /**
   * Adds a new key value to the store.
   *
   * @param {*} val
   * @param {PrimaryKey} [key] - The primary key of the record
   * @returns {Promise}
   */
  set(val, key) {
    return this.dbPromise.then(db => {
      const tx = db.transaction(this.storeKey, 'readwrite');
      tx.objectStore(this.storeKey).put(val, key);
      return tx.complete;
    });
  }

  /**
   * Removes a key or a range of keys from the store.
   *
   * @param {Key|IDBKeyRange} key
   * @returns {Promise}
   */
  delete(key) {
    return this.dbPromise.then(db => {
      const tx = db.transaction(this.storeKey, 'readwrite');
      tx.objectStore(this.storeKey).delete(key);
      return tx.complete;
    });
  }

  /**
   * Clear all keys from the store.
   *
   * @returns {Promise}
   */
  clear() {
    return this.dbPromise.then(db => {
      const tx = db.transaction(this.storeKey, 'readwrite');
      tx.objectStore(this.storeKey).clear();
      return tx.complete;
    });
  }

  /**
   * Retrives all keys from the store or a range of keys.
   *
   * @param {IDBKeyRange} [query]
   * @param {Number} [count] -  Number of values to return
   * @returns {Promise}
   */
  getAllKeys(query, count) {
    return this.dbPromise.then(db => {
      const tx = db.transaction(this.storeKey);
      const keys = [];
      const store = tx.objectStore(this.storeKey);
      // store.getAllKeys()
      (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
        if (!cursor) return;
        keys.push(cursor.key);
        cursor.continue();
      });

      return tx.complete.then(() => keys);
    });
  }

  /**
   * Retrives all records from the store.
   * If query is set then returns all records
   * that match the provided key or IDBKeyRange.
   *
   * @param {Key|IDBKeyRange} [query]
   * @param {Number} [count] - number of values to return
   */
  getAll(query, count) {
    return this.dbPromise.then(db => {
      const tx = db.transaction(this.storeKey);
      const store = tx.objectStore(this.storeKey);
      const keys = store.getAll(query, count);
      return tx.complete.then(() => keys);
    });
  }

  /**
   * Returns all records or the total number of records
   * that match the provided key or IDBKeyRange.
   *
   * @param {Key|IDBKeyrange} [query]
   * @returns {Promise}
   */
  count(query) {
    return this.dbPromise.then(db => {
      return db.transaction(this.storeKey)
        .objectStore(this.storeKey).count(query);
    });
  }

}

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
 * Class representing an open connection to a IDBDatabase object.
 *
 * @constructor
 * @param {String} dbName
 * @param {Number} version
 * @returns {DB}
 */
class DB {
  constructor(dbName, version) {
    this.dbPromise = null;
    this.open(dbName, version);
  }

  /**
   * Opens a connection to the database.
   *
   * @param {String} dbName
   * @param {Number} version
   * @returns {Promise}
   */
  open(dbName, version) {
    const dbPromise = idb.open(dbName, version).then(db => {
      const names = db.objectStoreNames;
      for (var i = 0; i < names.length; i++) {
        this[names[i]] = new Store(names[i], this.dbPromise);
      }
    });
    this.dbPromise = dbPromise;
    return dbPromise;
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
    return this.dbPromise.then(db => {
      return db.close();
    });
  }

  /**
   * Returns a transaction object(IDBTransaction).
   *
   * @param {String[]|IDBDatabase.objectStoreNames} [storeNames]
   * @param {String} [mode]
   */
  transaction(storeNames, mode) {
    return this.dbPromise.then(db => {
      return db.transaction(storeNames, mode);
    });
  }

}

module.exports = DB;