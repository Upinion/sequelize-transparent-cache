class VariableAdaptor {
  constructor (store = {}) {
    this.store = store
  }

  _ensureModel (model) {
    if (!this.store[model]) {
      this.store[model] = {}
    }
  }

  set ([model, ...ids], value) {
    this._ensureModel(model)

    this.store[model][ids.join()] = JSON.stringify(value)
    return Promise.resolve()
  }

  get ([model, ...ids]) {
    this._ensureModel(model)
    const data = this.store[model][ids.join()]

    return Promise.resolve(data ? JSON.parse(data) : data)
  }

  del ([model, ...ids], noObjectId) {
    this._ensureModel(model)

    if (notObjectId) {
        delete this.store[model];
    } else {
        delete this.store[model][ids.join()]
    }
    return Promise.resolve()
  }
}

module.exports = VariableAdaptor
