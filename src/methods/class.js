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
          return cache.save(client, instance)
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
            .then(instances => cache.saveAll(client, model, instances, customKey))
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
                    return cache.save(client, instance, customKey)
                })
        })
    },
    findByPk (id) {
      const customKey = generateKey(`findByPk:${model.name}`, id);
      return cache.get(client, model, customKey)
        .then(instance => {
          if (instance) {
            return instance
          }

          return (model.findByPk || model.findById).apply(model, arguments)
            .then(instance => cache.save(client, instance))
        })
    },
    findById () {
      return this.findByPk.apply(this, arguments)
    },
    upsert (data) {
      return model.upsert.apply(model, arguments).then(created => {
        return cache.destroy(client, model.build(data))
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
            .then(instances => cache.saveAll(client, model, instances, customKey))
        })
    },
    findOne () {
      return cache.get(client, model, customKey)
        .then(instance => {
          if (instance) {
            return instance
          }

          return model.findOne.apply(model, arguments)
            .then(instance => cache.save(client, instance, customKey))
        })
    },
    purgeCache () {
      return cache.clearKey(client, null, model)
    }
  }
}

module.exports = { auto: buildAutoMethods, manual: buildManualMethods }
