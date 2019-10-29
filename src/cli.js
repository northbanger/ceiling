import Ceiling from '.'
import { mapValues, values, join } from '@functions'

export default class {

  constructor(options) {
    this.ceiling = new Ceiling(require(options.config))
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
    return 'Are you sure you want to ...\n' + this.ceiling.syncProviders
      |> mapValues(
        (syncProvider, syncProviderName) => {
          const fromEndpoint = this.ceiling.getEndpoint(fromEndpointName, syncProviderName)
          const toEndpoint = this.ceiling.getEndpoint(toEndpointName, syncProviderName)
          return ` - ${syncProvider.endpointToString(fromEndpoint)} => ${syncProvider.endpointToString(toEndpoint)}\n`
        }
      )
      |> values
      |> join('')
  }
}
