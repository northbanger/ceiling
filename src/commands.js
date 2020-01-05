import config from './config'
import { map, unary, pullAll, mapValues, values, join, isEmpty, promiseAll, reduce } from '@dword-design/functions'
import glob from 'glob-promise'
import P from 'path'
import Confirm from 'prompt-confirm'
import getPluginName from './get-plugin-name'

const confirm = (fromEndpointName, toEndpointName, { yes }) => yes
  ? true
  : (() => {
    const hints = config.plugins
      |> mapValues(
        ({ endpointToString }, pluginName) => {
          const fromPluginConfig = config.endpoints[fromEndpointName]?.[pluginName]
          const toPluginConfig = config.endpoints[toEndpointName]?.[pluginName]
          return ` - ${fromPluginConfig |> endpointToString} => ${toPluginConfig |> endpointToString}\n`
        }
      )
      |> values
      |> join('')
    const confirm = new Confirm(`Are you sure you want to …\n${hints}`)
    return confirm.run()
  })()

const sync = async (operation, endpointName = 'live') => {
  if (config.plugins |> isEmpty) {
    console.log('No sync providers defined. Doing nothing …')
  } else {
    return config.plugins
      |> mapValues(({ endpointToString, sync }, pluginName) => {
        const fromPluginConfig = config.endpoints[operation === 'push' ? 'local' : endpointName]?.[pluginName]
        const toPluginConfig = config.endpoints[operation === 'push' ? endpointName : 'local']?.[pluginName]
        console.log(`${endpointToString(fromPluginConfig)} => ${endpointToString(toPluginConfig)} …`)
        return sync(fromPluginConfig, toPluginConfig)
      })
      |> values
      |> promiseAll
      |> await
  }
}

export default {
  push: {
    arguments: '[endpoint]',
    description: 'Push data to an endpoint or to all endpoints',
    options: [
      {
        name: '-y, --yes',
        description: 'do not ask for confirmation',
      },
    ],
    handler: async (endpointName, options) => {
      const yes = confirm('local', endpointName, options) |> await
      if (yes) {
        return sync('push', endpointName)
      }
    },
  },
  pull: {
    arguments: '[endpoint]',
    description: 'Pull data from an endpoint or from all endpoints',
    options: [
      {
        name: '-y, --yes',
        description: 'do not ask for confirmation',
      },
    ],
    handler: async (endpointName, options) => {
      const yes = confirm(endpointName, 'local', options) |> await
      if (yes) {
        return sync('pull', endpointName)
      }
    },
  },
  migrate: {
    arguments: '[endpoint]',
    description: 'Migrate data at an endpoint',
    options: [
      {
        name: '-y, --yes',
        description: 'do not ask for confirmation',
      },
    ],
    handler: async (endpointName = 'local') =>
      glob('*', { cwd: 'migrations' })
        |> await
        |> map(async shortPluginName => {
          const pluginName = shortPluginName |> getPluginName
          const { endpointToString, getExecutedMigrations, setExecutedMigrations, getMigrationParams } = config.plugins[pluginName]
          const migrationNames = glob('*', { cwd: P.resolve('migrations', pluginName) })
            |> await
            |> map(unary(P.basename))

          const pluginConfig = config.endpoints[endpointName]?.[pluginName]

          console.log(`Migrating ${pluginConfig |> endpointToString} …`)

          const executedMigrations = pluginConfig |> getExecutedMigrations |> await
          migrationNames
            |> pullAll(executedMigrations)
            |> map(name => {
              console.log(name)
              const { up } = require(P.resolve('migrations', shortPluginName, name))
              return up(pluginConfig |> getMigrationParams)
            })
            |> reduce((acc, promise) => acc.then(() => promise), Promise.resolve())
            |> await
          return setExecutedMigrations(pluginConfig, migrationNames)
        }),
  },
}
