# IndexedDB Promises ES6 Store Wrapper
ES6 class wrapper for creating and managing IndexedDB stores, built on top of [jakearchibald](https://github.com/jakearchibald) `idb` lib.

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
      options: {autoIncrement:true}
    },
    index: {
      name: 'myIndex',
      property: 'property',
      options: {unique: false}
    }

  }];

const db = new DB('myDB', 1, storesData);

db.keyStore.set('foo', 42).then(() => {
  db.keyStore.keys().then(keys => {
    console.log('keys', keys);
  });
});

db.stores().then(names => {
  console.log('store names', names);
});

```

## Methods
- `DB.hasSupport()`
- `db.name()`
- `db.version()`
- `db.close()`
- `db.stores()`

- `db[store].get(key)`
- `db[store].set(key, val)`
- `db[store].delete(key)`
- `db[store].clear()`
- `db[store].keys()`


