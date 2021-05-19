class IORedisAdaptor {
  constructor ({ client, namespace, lifetime }) {
    this.client = client
    this.namespace = namespace
    this.prefix = prefix;
    this.lifetime = lifetime
  }

  _withNamespace (key, noPrefix) {
    const namespace = this.namespace
    const keyWithNamespace = namespace
      ? [namespace, ...key]
      : key
    if (!noPrefix && this.prefix) {
      const objectId = keyWithNamespace.pop();
      keyWithNamespace.push(this.prefix);
      keyWithNamespace.push(objectId);
    }
    return keyWithNamespace.join(':')
  }

  set (key, value) {
    const options = this.lifetime
      ? ['EX', this.lifetime]
      : []

    return this.client.set(
      this._withNamespace(key),
      JSON.stringify(value),
      options
    )
  }

  get (key) {
    return this.client.get(this._withNamespace(key))
      .then(data => {
        if (!data) {
          return data
        }

        return JSON.parse(data, (key, value) => {
          return value && value.type === 'Buffer'
            ? Buffer.from(value.data)
            : value
        })
      })
  }

  del (key, noPrefix) {
    return this.client.del(this._withNamespace(key, noPrefix))
  }
}

module.exports = IORedisAdaptor
