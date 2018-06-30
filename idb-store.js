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
   * Retrives a key from the store.
   *
   * @param {String} key
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
   * @param {String} key
   * @param {*} val
   * @returns {Promise}
   */
  set(key, val) {
    return this.dbPromise.then(db => {
      const tx = db.transaction(this.storeKey, 'readwrite');
      tx.objectStore(this.storeKey).put(val, key);
      return tx.complete;
    });
  }

  /**
   * Removes a key from the store.
   *
   * @param {String} key
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
   * Retrives all keys from the store.
   *
   * @returns {Promise}
   */
  keys() {
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
      for (var i = 0; i < names.length; i++) {
        this[names[i]] = new Store(names[i], this.dbPromise);
      }
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
  get stores() {
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
   * Checks if indexedDB is supported.
   *
   * @static
   * @returns {Boolean}
   */
  static hasSupport() {
    if (!('indexedDB' in window)) {
      console.warn('This environment doesn\'t support IndexedDB');
      return false;
    }
    return true;
  }
}

module.exports = DB;