# sequelize-transparent-cache

Simple to use and universal cache layer for Sequelize.

* Abstract: does not depends on underlying database, or cache specific
* Transparent: objects returned from cache are regular Sequelize instances with all your methods
* Explicit: all calls to cache comes through `cache()` method
* Lightweight: zero additional dependencies

## Installation

Install sequelize-transparent-cache itself:

```npm install --save sequelize-transparent-cache```

Find and install appropriate adaptor for your cache system, see "Available adaptors" section below.
In this example we will use [ioredis](https://www.npmjs.com/package/ioredis)

```npm install --save sequelize-transparent-cache-ioredis```

## Example usage

```javascript
const Redis = require('ioredis')
const redis = new Redis()

const RedisAdaptor = require('sequelize-transparent-cache/sequelize-transparent-cache-ioredis')
const redisAdaptor = new RedisAdaptor({
  client: redis,
  namespace: 'model',
  lifetime: 60 * 60
})

const sequelizeCache = require('sequelize-transparent-cache')
const { withCache } = sequelizeCache(redisAdaptor)

const Sequelize = require('sequelize')
const sequelize = new Sequelize('database', 'user', 'password', {
  dialect: 'mysql',
  host: 'localhost',
  port: 3306
})

// Register and wrap your models:
// withCache() will add cache() methods to all models and instances in sequelize v4
const User = withCache(sequelize.import('./models/user'))

await sequelize.sync()

// Cache result of arbitrary query - requires cache key
await User.cache('active-users').findAll({
  where: {
    status: 'ACTIVE'
  }
})

// Create user in db and in cache
await User.cache().create({
  id: 1,
  name: 'Daniel'
})

// Load user from cache
const user = await User.cache().findByPk(1);

// Update in db and cache
await user.cache().update({
  name: 'Vikki'
})

```

Look for all examples applications in `examples` folder.

* [Usage with memcached](https://github.com/Upinion/sequelize-transparent-cache/blob/master/examples/memcached-mysql)
* [Usage with ioredis](https://github.com/Upinion/sequelize-transparent-cache/blob/master/examples/redis-mysql)

## Methods

Object returned by `cache()` call contains wrappers for **limited subset** of sequelize model or instance methods.

Instance:

* [`save()`](http://docs.sequelizejs.com/class/lib/model.js~Model.html#instance-method-save)
* [`update()`](http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-update)
* [`destroy()`](http://docs.sequelizejs.com/class/lib/model.js~Model.html#instance-method-destroy)
* [`reload()`](http://docs.sequelizejs.com/class/lib/model.js~Model.html#instance-method-reload)
* `purgeCache()` - remove data associated to model from cache (only ioredis)

Model:
* Automatic cache methods - does not require cache key: `cache()`
  * [`create()`](http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-create)
  * [`findAll()`](http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-findAll)
  * [`findOne()`](http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-findOne)
  * [`findByPk()`](http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-findByPk)
  * `purgeCache()` - remove data associated to model from cache (only ioredis)

  * [`upsert()`](http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-upsert) - **EXPERIMENTAL**
  * [`insertOrUpdate()`](http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-upsert) - **EXPERIMENTAL**
* Manual cache methods - require cache key: `cache(key)`
  * [`findAll()`](http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-findAll)
  * [`findOne()`](http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-findOne)
  * `purgeCache()` - remove data associated to model from cache (only ioredis)

In addition, both objects will contain `client()` method to get cache adaptor.

## Available adaptors

* [memcached](https://github.com/Upinion/sequelize-transparent-cache/tree/master/sequelize-transparent-cache-memcached)
* [memcache-plus](https://github.com/Upinion/sequelize-transparent-cache/tree/master/sequelize-transparent-cache-memcache-plus)
* [ioredis](https://github.com/Upinion/sequelize-transparent-cache/tree/master/sequelize-transparent-cache-ioredis)
* [variable](https://github.com/Upinion/sequelize-transparent-cache/tree/master/sequelize-transparent-cache-variable)
* [dummy](https://github.com/Upinion/sequelize-transparent-cache/tree/master/sequelize-transparent-cache-dummy)

You can easy write your own adaptor. Each adaptor must implement 3 methods:

* `get(path: Array<string>): Promise<object>`
* `set(path: Array<string>, value: object): Promise<void>`
* `del(path: Array<string>): Promise<void>`

Checkout existed adaptors for reference implementation.

## TODO
Add support for purgeCache to `memcahed`, `memcached-plus` and `variable` caches.
