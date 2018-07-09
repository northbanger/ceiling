const NoProvidersError = require('./no-providers-error')
const _ = require('lodash')
const EndpointNotFoundError = require('./endpoint-not-found-error')

class Ceiling {

  static get PUSH() {
    return 'push'
  }
  static get PULL() {
    return 'pull'
  }

  constructor(obj) {
    this.syncProviders = {}
    this.endpoints = {}
    Object.assign(this, obj)
  }

  getEndpoint(endpointName, syncProviderName) {
    const result = this.endpoints[endpointName]
    if (result == null) {
      throw new EndpointNotFoundError(endpointName)
    }
    return result[syncProviderName]
  }

  validate(endpoint) {
    _.forIn(this.syncProviders, syncProvider => syncProvider.validate(endpoint))
  }

  _sync(operation, endpointName) {
    if (_.isEmpty(this.syncProviders)) {
      throw new NoProvidersError()
    }

    return Promise.all(_.values(_.mapValues(this.syncProviders, (syncProvider, syncProviderName) => {
      const fromEndpoint = this.getEndpoint(operation == Ceiling.PUSH ? 'local' : endpointName, syncProviderName)
      const toEndpoint = this.getEndpoint(operation == Ceiling.PUSH ? endpointName : 'local', syncProviderName)
      console.log(`${syncProvider.endpointToString(fromEndpoint)} => ${syncProvider.endpointToString(toEndpoint)} ...`)
      return syncProvider.sync(fromEndpoint, toEndpoint)
    })))
  }

  push(endpointName) {
    return this._sync(Ceiling.PUSH, endpointName)
  }

  pull(endpointName) {
    return this._sync(Ceiling.PULL, endpointName)
  }
}

module.exports = Ceiling
