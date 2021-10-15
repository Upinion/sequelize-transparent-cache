# sequelize-transparent-cache-memcache

[memjs](https://memjs.netlify.app/) adaptor for [sequelize-transparent-cache](https://www.npmjs.com/package/sequelize-transparent-cache).

Stores sequelize objects in memcached using memjs client in Doctrine Cache format.

## Example usage

```javascript
const MemJS = require('memjs')

// Will initiate a connection to 'my-memcache-server.com' on port 12345
const clientM = new MemJS('my-memcache-server.com:12345')

const MemcacheAdaptor = require('sequelize-transparent-cache/sequelize-transparent-cache-doctrine-memjs')

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
| `client`    | memcache-plus instance | yes      | Configured [memcache instance](https://memjs.netlify.app/) |
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
