# sequelize-transparent-cache-memcache

[memcache-plus](https://www.npmjs.com/package/memcache-plus) adaptor for [sequelize-transparent-cache](https://www.npmjs.com/package/sequelize-transparent-cache).

Stores sequelize objects in memcached using memcache-plus client in Doctrine Cache format.

## Example usage

```javascript
const MemcachePlus = require('memcache-plus')

// Will initiate a connection to 'my-memcache-server.com' on port 12345
const clientM = new MemcachePlus('my-memcache-server.com:12345')

const MemcacheAdaptor = require('sequelize-transparent-cache/sequelize-transparent-cache-doctrine-memcache')

const memcacheAdaptor = new MemcacheAdaptor({
  client: clientM,
  namespace: 'model',  // optional
  prefix: 'sequelize', // optional
  lifetime: 60 * 60    // optional
})

```

## Constructor arguments

| Param       | Type             | Required | Description                                                                     |
|-------------|------------------|----------|---------------------------------------------------------------------------------|
| `client`    | memcache-plus instance | yes      | Configured [memcache instance](https://memcache-plus.com/initialization.html) |
| `namespace` | string           | no       | Prefix for all keys                                                             |
| `prefix`    | string           | no       | Prefix for the objectId (useful if you have multiple orms using the same cache) |
| `lifetime`  | integer          | no       | Keys lifetime, seconds                                                          |
| `cacheKeyLifetime`  | integer          | no       | Cache keys lifetime, seconds                                                          |

## Storing format
Each object stored as single JSON string.
Namespace delimeter is ":".

| Key                                  | Value           |
|--------------------------------------|-----------------|
| `<namespace>:<dbTableName>[<prefix>_<objectId>][doctrineVersion]` | `{JSON string}` |

### Cache versions
Doctrine uses versions to flush the cache, storing the current version in the `DoctrineNamespaceVersion` key

- Versions are increased the the cache is purged
- Default ttl for cache version is 1 week

For more info see [sequelize-transparent-cache](https://www.npmjs.com/package/sequelize-transparent-cache)
