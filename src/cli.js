const Ceiling = require('./ceiling')
const _ = require('lodash')
const babelRegister = require('@babel/register')
const path = require('path')

babelRegister({
  configFile: path.resolve(__dirname, 'babel.config.js'),
  ignore: [/node_modules/],
})

class Cli {

  constructor(options) {
    this.ceiling = new Ceiling(require(options.config).default)
  }

  push(endpointName) {
    return this.ceiling.push(endpointName)
  }

  pull(endpointName) {
    return this.ceiling.pull(endpointName)
  }

  migrate(endpointName) {
    return this.ceiling.migrate(endpointName)
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
