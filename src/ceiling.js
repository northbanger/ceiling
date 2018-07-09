const _ = require('lodash')
const notnull = require('not-null')

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
    return notnull(this.endpoints[endpointName], {})[syncProviderName]
  }

  validate(endpoint) {
    _.forIn(this.syncProviders, syncProvider => syncProvider.validate(endpoint))
  }

  _sync(operation, endpointName) {
    if (_.isEmpty(this.syncProviders)) {
      console.log('No sync providers defined. Doing nothing ...')
    }

    return Promise.all(_.values(_.mapValues(this.syncProviders, (syncProvider, syncProviderName) => {
      const fromEndpoint = this.getEndpoint(operation == Ceiling.PUSH ? 'local' : endpointName, syncProviderName)
      const toEndpoint = this.getEndpoint(operation == Ceiling.PUSH ? endpointName : 'local', syncProviderName)
      const endpointToString = notnull(syncProvider.endpointToString, JSON.stringify)
      console.log(`${endpointToString.call(syncProvider, fromEndpoint)} => ${endpointToString.call(syncProvider, toEndpoint)} ...`)

      if (syncProvider.sync == null) {
        console.log(`Sync function missing for sync provider '${syncProviderName}'. Doing nothing ...`)
      } else {
        try {
          return syncProvider.sync(fromEndpoint, toEndpoint)
        } catch (err) {
          return new Promise((resolve, reject) => reject(err))
        }
      }
    })))
      .catch(err => console.log(err.message))
  }

  push(endpointName = 'live') {
    return this._sync(Ceiling.PUSH, endpointName)
  }

  pull(endpointName = 'live') {
    return this._sync(Ceiling.PULL, endpointName)
  }
}

module.exports = Ceiling
