# GraphQL Simple Cache
### A simple, flexible, scalable caching solution for graphql servers.

While this solution was developed with caching for GraphQL servers in mind, it can be used in pretty much any server side framework.  This cache was designed to be used on your server side code within your GraphQL server and was designed to be very fast and very simple to implement.  I developed this because the popular DataLoader package did not meet my needs as written.

## Installation

Installation of this package can be performed using NPM.  I am pretty sure Yarn can be used as well, but I have not used nor tested with Yarn.  NPM installation is done as follows:
```
npm install graphql-simple-cache
```

## Usage

### Importing

Importing of the cache is done as follows:
```
const { GraphQLSimpleCache } = require('graphql-simple-cache');
```
or alternatively as:
```
import { GraphQLSimpleCache } from 'graphql-simple-cache';
```

### Instantiaton

To instantiate the cache, create a new instance as follows:
```
const cache = new GraphQLSimpleCache();
```
If you wish to have you cached data store in an external datastore, create an oject to implement the get, set, delete and pass that object to the cache constructor as follows:
```
const cache = new GraphQLSimpleCache(externalCache);
```

### Usage

#### Caching data
To cache the results of a data retrieval call, invoke the `load` method as follows:
```
const myResult = await cache.load({
        options: <object containing the keys for your data retrieval call, this will be used as the key for the cache>,
        excludeKeys: <optional: items contained in your options object that you may want excluded from your cache key>,
        altKey: <optional: key to bbe used instead of data contained in options object>,
        loader: <function that you keys will be passed to in order to invoke your data retrieval>,
        expiry: <optional: time in milliseconds before the cache data expires and the loader must be invoked again to get fresh data.>
    });
```
Future calls to retrieve data will utilize the cached result as long as the expiration period has not elapsed.  If it has, then results will bbe retrieved from the data source again, then cached.

Alternatively, you may want to create a thunk similar to how DataLoader functions today.  This can be accomplished as follows:
```
const myLoader = cache.loader({
    fn: (keys) => <dataRetrieval function>(keys),
    excludeKeys: <optional: items contained in your options object that you may want excluded from your cache key>,
    altKey: <optional: key to bbe used instead of data contained in options object>,
    expiry: <optional: time in milliseconds before the cache data expires and the loader must be invoked again to get fresh data.>
});

const myResult = myLoader(keys);
```

#### Removing single item from the cache
Removal of an item from the cache is accomplished by passing the options/key object to the `delete` method as follows:
```
cache.delete({
        options: <object containing the keys for your data retrieval call, this will be used as the key for the cache>,
        excludeKeys: <optional: items contained in your options object that you may want excluded from your cache key>,
        altKey: <optional: key to bbe used instead of data contained in options object>,
});
```

#### Removing all data from the cache
Removal of all data from the cache is accomplished by invoking the `flush` method as follows:
```
cache.flush();
```

#### Extracting all data from the cache
Extraction of all data from the cache is accomplished by invoking the `dump` method as follows:
```
const cachedData = cache.dump();
```

#### Preload data into the cache
Preloading of all data into the cache is accomplished by invoking the `prime` method as follows:
```
cache.prime(data);
```
Data is expected to be in the format that the cache would deliver from an extraction(above).  The basic format is:
```
{
    key: { 
        data: <raw data>, 
        ttl: <time in milliseconds that data will expire or 0 for no expiration>, 
        created: <time in milliseconds that entry was created>
    },
    key: {data, ttl, created},
    key: {data, ttl, created},
    key: {data, ttl, created},
    key: {data, ttl, created},
    ...
}
```
## Advanced Usage

### External cache

This cache is design to easily work with any external cache/database to back its storage/retrieval for large/enterprise scale implementations.  Such implementations require that you write your own interface that implements the following skeleton:

```
const externalCache =
{
    //required
    get: (key) => { 
        // code to retrieve data from your external caching mechanism
        ...
        return <value retrieved above>;
    },
    put: (key, value) => {
        // code to store key/value pair in your external caching mechanism
        ...
        return;
    },
    delete: (key) => {
        // code to delete data by key from your external caching mechanism
        ...
        return <any return value from external cache (e.g. success/fail code)>;
    },
    flush: (key) => {
        // code to delete all data from your external caching mechanism
        ...
        return <any return value from external cache (e.g. success/fail code)>;
    },
    //optional
    prime: (object) => {
        // code load data object produced from dump (below) into your external cache
        ...
        return <any return value from external cache (e.g. success/fail code)>;
    },
    dump: () => {
        // code to extract all data from your external caching mechanism
        ...
        return <data retrieved above>;
    }
};
```
Once you have implemented your interface to interact with the external caching mechanism/database, simply instation your cache like this:

```
const cache = new GraphQLSimpleCache(externalCache);
```
#### Handling connectivity when dealing with an external cache
If your cache has a way of telling you when it is available/unavailable, or if using an in memory database, and the driver indicates it is not connected, (e.g. in the case of Redis, it may not be installed on devloper systems, and only be available in test/production servers) add a **connected** indicator to your external cache interface implementation as follows:

```
const externalCache =
{
    ...
    ...
    connected: true,
    ...
    ...
}
```
Simply perform `externalCache.connected = false;` when not connected and `externalCache.connected` when connected.  The framework will take care of falling back to non use of cache when not connected instead of failing and bringing down your application.

### Sample Code
Several test have been provided to give you various implementation examples.

[View Release Notes](CHANGELOG.md)
