const { instanceToData, dataToInstance } = require('./util')

function getInstanceModel (instance) {
  return instance.constructor
}

function getInstanceCacheKey (instance) {
  return getInstanceModel(instance).primaryKeyAttributes.map(pk => instance[pk])
}

async function save (client, instance, customKey) {
  if (!instance) {
    return Promise.resolve(instance)
  }

  const key = [
    getInstanceModel(instance).tableName
  ]

  if (customKey) {
    key.push(customKey)
  } else {
    key.push(...getInstanceCacheKey(instance))
  }

  return client.set(key, instanceToData(instance)).then(() => instance)
}

function saveAll (client, model, instances, customKey) {
  const key = [
    model.tableName,
    customKey
  ]

  return client.set(key, instances.map(instanceToData)).then(() => instances)
}

function getAll (client, model, customKey) {
  const key = [
    model.tableName,
    customKey
  ]

  return client.get(key).then(dataArray => {
    if (!dataArray) { // undefined - cache miss
      return dataArray
    }
    return dataArray.map(data => dataToInstance(model, data))
  })
}

function get (client, model, id) {
  const key = [
    model.tableName,
    id
  ]

  return client.get(key).then(data => {
    return dataToInstance(model, data)
  })
}

function destroy (client, instance) {
  if (!instance) {
    return Promise.resolve(instance)
  }

  const key = [
    getInstanceModel(instance).tableName,
    ...getInstanceCacheKey(instance)
  ]
  return client.del(key)
}

function clearKey (client, instance, model) {
  const key = [
    model ? model.tableName : getInstanceModel(instance).tableName
  ]
  if (client.clearKey) {
      return client.clearKey(key)
  }
  return Promise.resolve(false);
}

module.exports = {
  save,
  saveAll,
  get,
  getAll,
  destroy,
  clearKey
}
