# sequelize-transparent-cache-ioredis

[ioredis](https://www.npmjs.com/package/ioredis) adaptor for [sequelize-transparent-cache](https://www.npmjs.com/package/sequelize-transparent-cache).

Stores sequelize objects in redis using ioredis client in Doctrine Cache format.

## Example usage

```javascript
const Redis = require('ioredis')
const redis = new Redis()

const RedisAdaptor = require('sequelize-transparent-cache/sequelize-transparent-cache-ioredis')
const redisAdaptor = new RedisAdaptor({
  client: redis,
  namespace: 'model',  // optional
  prefix: 'sequelize', // optional
  lifetime: 60 * 60    // optional
})

```

## Constructor arguments

| Param       | Type             | Required | Description                                                                     |
|-------------|------------------|----------|---------------------------------------------------------------------------------|
| `client`    | ioredis instance | yes      | Configured [ioredis instance](https://github.com/luin/ioredis#connect-to-redis) |
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
