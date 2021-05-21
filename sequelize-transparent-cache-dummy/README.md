# sequelize-transparent-cache-variable

Dummy adaptor for [sequelize-transparent-cache](https://www.npmjs.com/package/sequelize-transparent-cache).

Stores sequelize objects in variable. Useful for debugging purposes.

**Warning**: Do not use this adaptor unless you want to force disable caching.

## Example usage

```javascript
const DummyAdaptor = require('sequelize-transparent-cache/sequelize-transparent-cache-dummy')
const DummyAdaptor = new DummyAdaptor()
```

## Storing format
This adaptor does not store anything at all.
