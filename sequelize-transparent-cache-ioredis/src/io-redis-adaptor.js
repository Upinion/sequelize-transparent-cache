class IORedisAdaptor {
  constructor ({ client, namespace, prefix, lifetime }) {
    this.client = client
    this.namespace = namespace
    this.prefix = prefix;
    this.lifetime = lifetime
    this.delimiter = ':'
  }

  _allNamespace (key) {
    const namespace = this.namespace
    const keyWithNamespace = namespace
      ? [namespace, ...key]
      : key
    const keyNameSpace = keyWithNamespace.join(this.delimiter)
    return `${keyNameSpace}\\[*\\]`;
  }

  _withNamespace (key) {
    const namespace = this.namespace
    const keyWithNamespace = namespace
      ? [namespace, ...key]
      : key
    let objectId = keyWithNamespace.pop();
    if (this.prefix) {
      objectId = `${this.prefix}_${objectId}`;
    }
    const keyNameSpace = keyWithNamespace.join(this.delimiter)
    return `${keyNameSpace}[${objectId}]`;
  }

  set (key, value) {
    const options = this.lifetime
      ? ['EX', this.lifetime]
      : []

    return this.client.set(
      this._withNamespace(key),
      JSON.stringify(value),
      options
    );
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

  del (key, noObjectId) {
    if (noObjectId) {
      return this.client.keys(this._allNamespace(key))
        .then((keys) => { return this.client.del(keys); } );
    }
    return this.client.del(this._withNamespace(key));
  }
}

module.exports = IORedisAdaptor
