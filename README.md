# IndexedDB Promises ES6 Store Wrapper
ES6 class wrapper for creating and managing IndexedDB stores, built on top of [jakearchibald](https://github.com/jakearchibald) [idb](https://github.com/jakearchibald/idb) lib.

## Up and Running
```sh
npm install idb-store
```

## Usage
```js
const schemas = [
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

const DB = require('idb-store').DB;
const Store = require('idb-store').Store;

// Creates a new database.
DB.createDatabase('myDB', 1, schemas);

const db = new DB('myDB', 1);
const itemRepository = new Store('item', db);

// Creates a transactions and sets some data in the store.
itemRepository.set({ data: 42 })
  .then(itemRepository.getAll)
  .then(val => {
    console.log(val);
  });
});

// Opens a new connection and logs the database name.
db.open()
  .then(db.name)
  .then(name => {
    console.log('database name:', name);
  })
  .then(db.close)
});

```

## DB
Static properties:
- `DB.hasSupport`
- `DB.createDatabase`
- `DB.deleteDatabase`

## db
Properties:
- `db.name`
- `db.version`
- `db.objectStoreNames`

Methods:
- `db.close()`
- `db.transaction()`

Events:
- `onversionchange`
- `onabort`
- `onerror`
- `onclose`

## Stores
Methods:
- `db[store].get()`
- `db[store].set()`
- `db[store].delete()`
- `db[store].clear()`
- `db[store].getAllKeys()`
- `db[store].getAll()`
- `db[store].count()`


