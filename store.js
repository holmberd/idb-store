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
   * @param {String} [indexName]
   * @returns {Promise}
   */
  get(key, indexName) {
    const connection = this.getConnection();
    return connection.then(db => {
      const tx = db.transaction(this.storeKey);
      var val = null;
      if (indexName) {
        val = tx.objectStore(this.storeKey).index(indexName).get(key);
      } else {
        val = tx.objectStore(this.storeKey).get(key);  
      }
      db.close();
      return tx.complete.then(() => val);
    })
    .catch(err => {
      let _err = new Error(err);
      _err.message = 'Failed to get store record: ' + _err.message;
      return Promise.reject(_err);
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
    return connection.then(db => {
      var tx = db.transaction(this.storeKey, 'readwrite');
      var request = tx.objectStore(this.storeKey).put(val, key);
      db.close();
      return Promise.all([request, tx.complete]);
    })
    .catch(err => {
      let _err = new Error(err);
      _err.message = 'Failed to set store record: ' + _err.message;
      return Promise.reject(_err);
    });
  }

  /**
   * Removes a key or a range of keys from the store.
   *
   * @param {Key|IDBKeyRange} key
   * @param {String} [indexName]
   * @returns {Promise}
   */
  delete(key, indexName) {
    const connection = this.getConnection();
    return connection.then(db => {
      const tx = db.transaction(this.storeKey, 'readwrite');
      if (indexName) {
        tx.objectStore(this.storeKey).index(indexName).delete(key);  
      } else {
        tx.objectStore(this.storeKey).delete(key);
      }
      db.close();
      return tx.complete;
    })
    .catch(err => {
      let _err = new Error(err);
      _err.message = 'Failed to remove store record: ' + _err.message;
      return Promise.reject(_err);
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
      let _err = new Error(err);
      _err.message = 'Failed to clear store records: ' + _err.message;
      return Promise.reject(_err);
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
      // TODO: store.getAllKeys()
      (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
        if (!cursor) return;
        keys.push(cursor.key);
        cursor.continue();
      });
      db.close();
      return tx.complete.then(() => keys);
    })
    .catch(err => {
      let _err = new Error(err);
      _err.message = 'Failed to get store keys: ' + _err.message;
      return Promise.reject(_err);
    });
  }

  /**
   * Retrives all records from the store.
   * If query is set then returns all records
   * that match the provided key or IDBKeyRange.
   *
   * @param {Key|IDBKeyRange} [query]
   * @param {Number} [count] - number of values to return
   * @param {String} [indexName]
   * @returns {Promise}
   */
  getAll(query, count, indexName) {
    const connection = this.getConnection();
    return connection.then(db => {
      const tx = db.transaction(this.storeKey);
      var store = tx.objectStore(this.storeKey);
      if (indexName) {
        store = tx.objectStore(this.storeKey).index(indexName);
      }
      const keys = store.getAll(query, count);
      db.close();
      return tx.complete.then(() => keys);
    })
    .catch(err => {
      let _err = new Error(err);
      _err.message = 'Failed to get all store records: ' + _err.message;
      return Promise.reject(_err);
    });
  }

  /**
   * Returns all records or the total number of records
   * that match the provided key or IDBKeyRange.
   *
   * @param {Key|IDBKeyrange} [query]
   * @param {String} [indexName]
   * @returns {Promise}
   */
  count(query, indexName) {
    const connection = this.getConnection();
    return connection.then(db => {
      const tx = db.transaction(this.storeKey);
      var val = null;
      if (indexName) {
        val = tx.objectStore(this.storeKey).index(indexName).count(query);
      } else {
        val = tx.objectStore(this.storeKey).count(query);  
      }
      db.close();
      return tx.complete.then(() => val);
    })
    .catch(err => {
      let _err = new Error(err);
      _err.message = 'Failed to get store count: ' + _err.message;
      return Promise.reject(_err);
    });
  }

}

module.exports = Store;
