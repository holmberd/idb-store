# IndexedDB Promises ES6 Store Wrapper
ES6 class wrapper for creating and managing IndexedDB stores, built on top of [jakearchibald](https://github.com/jakearchibald) [idb](https://github.com/jakearchibald/idb) lib.

## Up and Running
```sh
npm install idb-store
```

## Usage
```js
const storesData = [
  {
    create: {
      name: 'keyStore',
      options: {autoIncrement: true}
    },
    index: {
      name: 'myIndex',
      property: 'property',
      options: {unique: false}
    }

  }];

// Creates database and opens a connection.
const db = new DB('myDB', 1, storesData);

db.keyStore.set({ data: 42 }).then(() => {
  db.keyStore.getAllKeys().then(keys => {
    console.log('keys', keys);
  });
});

db.objectStoreNames.then(names => {
  console.log('store names', names);
});

```

## DB
Static properties:
- `DB.hasSupport`
- `DB.deleteDatabase`

## db
Properties:
- `db.name`
- `db.version`
- `db.objectStoreNames`

Methods:
- `db.close()`
- `db.transaction()`

## Stores
Methods:
- `db[store].get()`
- `db[store].set()`
- `db[store].delete()`
- `db[store].clear()`
- `db[store].getAllKeys()`
- `db[store].getAll()`
- `db[store].count()`


