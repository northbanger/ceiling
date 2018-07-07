const findUp = require('find-up')
const path = require('path')
const Ceiling = require('./ceiling')
const _ = require('lodash')

class Cli {

  constructor(options) {
    this.ceiling = new Ceiling(require(options.config))
  }

  push(endpointName) {
    return this.ceiling.push(endpointName)
  }

  pull() {
    return this.ceiling.pull(endpointName)
  }

  confirmString(fromEndpointName, toEndpointName) {
    return `Are you sure you want to ...\n` + _.values(_.mapValues(this.ceiling.syncProviders,
      (syncProvider, syncProviderName) => {
        const fromEndpoint = this.ceiling.getEndpoint(fromEndpointName, syncProviderName)
        const toEndpoint = this.ceiling.getEndpoint(toEndpointName, syncProviderName)
        return ` - ${syncProvider.endpointToString(fromEndpoint)} => ${syncProvider.endpointToString(toEndpoint)}\n`
      }
    )).join('')
  }
}

module.exports = Cli
