class DummyAdaptor {
  constructor () { }

  set ([model, ...ids], value) {
    return Promise.resolve()
  }

  get ([model, ...ids]) {
    return Promise.resolve(null)
  }

  del ([model, ...ids], noObjectId) {
    return Promise.resolve()
  }
}

module.exports = DummyAdaptor
