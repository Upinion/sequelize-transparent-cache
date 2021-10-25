const crypto = require('crypto');
const cache = require('../cache')

const generateKey = (prepend, args) => {
    const paramString = JSON.stringify(args, (key, value) => {
        // Replace all the problematic objects for the stringify to work
        if (key === 'model') {
            return value.name;
        } else if (key === 'association') {
            // Not fully tested
            return `${value.source.name}.${value.as}`;
        } else if (key === 'transaction'
            || key === 'logging'
            || key === 'lock'
        ) {
            return true;
        } else if (key === 'include' && value && value.length) {
            return value.map((x) => x && x.name ? x.name : x);
        } else if (value && typeof value === 'object') {
            const newValue = {};
            Object.keys(value).forEach(x => {
                newValue[x] = value[x];
            });
            Object.getOwnPropertySymbols(value).forEach(x => {
                newValue[x.toString()] = value[x];
            });
            return newValue;
        } else {
            return value;
        }
    });
    return crypto.createHash('md4').update(prepend+paramString).digest('hex');
}; 

function buildAutoMethods (client, model) {
  return {
    client () {
      return client
    },
    create () {
      return model.create.apply(model, arguments)
        .then(instance => {
          return cache.save(client, instance, cache.getQueryInclude(model, arguments))
        })
    },
    findAll () {
      const customKey = generateKey(`findAll:${model.name}`, arguments);
      return cache.getAll(client, model, customKey)
        .then(instances => {
          if (instances) { // any array - cache hit
              return instances
          }

          return model.findAll.apply(model, arguments)
            .then(instances => cache.saveAll(client, model, instances, cache.getQueryInclude(model, arguments), customKey))
        })
    },
    findOrCreate () {
      const customKey = generateKey(`findOrCreate:${model.name}`, arguments);
      return cache.get(client, model, customKey)
        .then(instance => {
          if (instance) {
              return [instance, false]
          }

          return model.findOrCreate.apply(model, arguments)
                .then(result => {
                    if (result[0]) {
                        return cache.save(client, result[0], cache.getQueryInclude(model, arguments), customKey)
                            .then(() => result)
                    }
                    return result
                })
        })
    },
    findOne () {
      const customKey = generateKey(`findOne:${model.name}`, arguments);
      return cache.get(client, model, customKey)
        .then(instance => {
          if (instance) {
              return instance
          }

          return model.findOne.apply(model, arguments)
                .then(instance => {
                    return cache.save(client, instance, cache.getQueryInclude(model, arguments), customKey)
                })
        })
    },
    findByPk (id) {
      return cache.get(client, model, id)
        .then(instance => {
          if (instance) {
              return instance
          }

          return (model.findByPk || model.findById).apply(model, arguments)
            .then(instance => cache.save(client, instance, cache.getQueryInclude(model, arguments)))
        })
    },
    findById () {
      return this.findByPk.apply(this, arguments)
    },
    upsert (data) {
      return model.upsert.apply(model, arguments).then(created => {
        return cache.clearKey(client, null, model)
          .then(() => created)
      })
    },
    insertOrUpdate () {
      return this.upsert.apply(this, arguments)
    },
    purgeCache () {
      return cache.clearKey(client, null, model);
    }
  }
}

function buildManualMethods (client, model, customKey) {
  return {
    client () {
      return client
    },
    findAll () {
      return cache.getAll(client, model, customKey)
        .then(instances => {
          if (instances) { // any array - cache hit
            return instances
          }

          return model.findAll.apply(model, arguments)
            .then(instances => cache.saveAll(client, model, instances, cache.getQueryInclude(model, arguments), customKey))
        })
    },
    findOrCreate () {
      return cache.get(client, model, customKey)
        .then(instance => {
          if (instance) {
            return [instance, false]
          }

          return model.findOrCreate.apply(model, arguments)
                .then(result => {
                    if (result[0]) {
                        return cache.save(client, result[0], cache.getQueryInclude(model, arguments), customKey)
                            .then(() => result)

                    }
                    return result
                })
        })
    },
    findOne () {
      return cache.get(client, model, customKey)
        .then(instance => {
          if (instance) {
            return instance
          }

          return model.findOne.apply(model, arguments)
            .then(instance => cache.save(client, instance, cache.getQueryInclude(model, arguments), customKey))
        })
    },
    purgeCache () {
      return cache.clearKey(client, null, model)
    }
  }
}

module.exports = { auto: buildAutoMethods, manual: buildManualMethods }
