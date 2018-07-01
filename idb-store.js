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
 * An object containing idb object store data.
 *
 * @typedef {Object} StoreData
 * @property {Object} create
 * @property {String} create.name
 * @property {Object} create.options
 * @property {Object} index
 * @property {String} index.name
 * @property {String} index.property
 * @property {Object} index.options
 */

/**
 * Class representing a open IDBDatabase object.
 *
 * @constructor
 * @param {String} dbName
 * @param {Number} version
 * @param {StoreData[]} storesData
 * @returns {DB}
 */
class DB {
  constructor(dbName, version, storesData) {
    this.dbPromise = null;
    this.open(dbName, version, storesData);
  }

  /**
   * Opens a connection to the database.
   *
   * @param {String} dbName
   * @param {Number} version
   * @param {StoreData[]} storesData
   * @returns {Promise}
   */
  open(dbName, version, storesData) {
    this.dbPromise = idb.open(dbName, version, upgradeDB => {
      let store = null;
      storesData.forEach(storeData => {
        if (!upgradeDB.objectStoreNames.contains(storeData.create.name, storeData.create.options)) {
          store = upgradeDB.createObjectStore(storeData.create.name);
          if (storeData.hasOwnProperty('index')) {
            store.createIndex(storeData.index.name, storeData.index.property, storeData.index.options);
          }
        }
      });
    });
    this.dbPromise.then(db => {
      const names = db.objectStoreNames;
      for (var i = 0; i < names; i++) {
        this[names[i]] = new Store(names[i], this.dbPromise);
      }
    });
    return this.dbPromise;
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
}

module.exports = DB;