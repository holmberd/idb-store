'use strict';

/**
 * Class representing a IndexedDB objectStore.
 *
 * @constructor
 * @param {String} storeKey
 * @param {DB} idbConnection
 * @returns {Store}
 */
class Store {
  constructor(storeKey, idbConnection) {
    this.storeKey = storeKey;
    this.idbConnection = idbConnection;
  }

  getConnection() {
    return this.idbConnection.open();
  }

  /**
   * Retrives a record or a range of records from the store.
   *
   * @param {Key|IDBKeyRange} key
   * @returns {Promise}
   */
  get(key) {
    const connection = this.getConnection();
    return connection.then(db => {
      const tx = db.transaction(this.storeKey);
      const val = tx.objectStore(this.storeKey).get(key);
      db.close();
      return tx.complete.then(() => val);
    })
    .catch(err => {
      err.message = 'Failed to get store record: ' + err.message;
      return Promise.reject(err);
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
    const connection = this.getConnection();
    let _db = null;
    return connection.then(db => {
      const tx = db.transaction(this.storeKey, 'readwrite');
      tx.objectStore(this.storeKey).put(val, key);
      db.close();
      return tx.complete;
    })
    .catch(err => {
      err.message = 'Failed to set store record: ' + err.message;
      return Promise.reject(err);
    });
  }

  /**
   * Removes a key or a range of keys from the store.
   *
   * @param {Key|IDBKeyRange} key
   * @returns {Promise}
   */
  delete(key) {
    const connection = this.getConnection();
    return connection.then(db => {
      const tx = db.transaction(this.storeKey, 'readwrite');
      tx.objectStore(this.storeKey).delete(key);
      db.close();
      return tx.complete;
    })
    .catch(err => {
      err.message = 'Failed to remove store record: ' + err.message;
      return Promise.reject(err);
    });
  }

  /**
   * Clear all keys from the store.
   *
   * @returns {Promise}
   */
  clear() {
    const connection = this.getConnection();
    return connection.then(db => {
      const tx = db.transaction(this.storeKey, 'readwrite');
      tx.objectStore(this.storeKey).clear();
      db.close();
      return tx.complete;
    })
    .catch(err => {
      err.message = 'Failed to clear store records: ' + err.message;
      return Promise.reject(err);
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
    const connection = this.getConnection();
    return connection.then(db => {
      const tx = db.transaction(this.storeKey);
      const keys = [];
      const store = tx.objectStore(this.storeKey);
      // store.getAllKeys()
      (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
        if (!cursor) return;
        keys.push(cursor.key);
        cursor.continue();
      });
      db.close();
      return tx.complete.then(() => keys);
    })
    .catch(err => {
      err.message = 'Failed to get store keys: ' + err.message;
      return Promise.reject(err);
    });
  }

  /**
   * Retrives all records from the store.
   * If query is set then returns all records
   * that match the provided key or IDBKeyRange.
   *
   * @param {Key|IDBKeyRange} [query]
   * @param {Number} [count] - number of values to return
   * @returns {Promise}
   */
  getAll(query, count) {
    const connection = this.getConnection();
    return connection.then(db => {
      const tx = db.transaction(this.storeKey);
      const store = tx.objectStore(this.storeKey);
      const keys = store.getAll(query, count);
      db.close();
      return tx.complete.then(() => keys);
    })
    .catch(err => {
      err.message = 'Failed to get all store records: ' + err.message;
      return Promise.reject(err);
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
    const connection = this.getConnection();
    return connection.then(db => {
      const tx = db.transaction(this.storeKey);
      const val = tx.objectStore(this.storeKey).count(query);
      db.close();
      return tx.complete.then(() => val);
    })
    .catch(err => {
      err.message = 'Failed to get store count: ' + err.message;
      return Promise.reject(err);
    });
  }

}

module.exports = Store;
