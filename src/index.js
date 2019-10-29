import sequential from 'promise-sequential'
import { readdirSync } from 'fs'
import P from 'path'
import { isEmpty, forIn, mapValues, values, omit, keys, stubArray, stubObject, zipObject, promiseAll } from '@functions'

export default class {

  constructor(obj) {
    this.syncProviders = {}
    this.endpoints = {}
    Object.assign(this, obj)
  }

  getEndpoint(endpointName, syncProviderName) {
    return (this.endpoints[endpointName] ?? {})[syncProviderName]
  }

  validate(endpoint) {
    this.syncProviders |> forIn(syncProvider => syncProvider.validate(endpoint))
  }

  async _sync(operation, endpointName) {
    if (isEmpty(this.syncProviders)) {
      console.log('No sync providers defined. Doing nothing ...')
    } else {
      try {
        return await (this.syncProviders
          |> mapValues(async (syncProvider, syncProviderName) => {
            if (syncProvider.sync != undefined) {
              const fromEndpoint = this.getEndpoint(operation == 'push' ? 'local' : endpointName, syncProviderName)
              const toEndpoint = this.getEndpoint(operation == 'push' ? endpointName : 'local', syncProviderName)
              const endpointToString = syncProvider.endpointToString || JSON.stringify

              console.log(`${endpointToString.call(syncProvider, fromEndpoint)} => ${endpointToString.call(syncProvider, toEndpoint)} ...`)
              return syncProvider.sync(fromEndpoint, toEndpoint)
            }
          })
          |> values
          |> promiseAll
        )
      } catch (error) {
        console.error(error.message)
      }
    }
  }

  push(endpointName = 'live') {
    return this._sync('push', endpointName)
  }

  pull(endpointName = 'live') {
    return this._sync('pull', endpointName)
  }

  get migrations() {
    const folders = readdirSync(this.migrationsFolder).filter(folder => !folder.startsWith('.'))
    return (this.migrationsFolder !== undefined && isEmpty(this.inlineMigrations))
      ? zipObject(
        folders,
        folders.map(syncProviderFolder => {
          const files = readdirSync(`${process.cwd()}/${this.migrationsFolder}/${syncProviderFolder}`)
          return zipObject(
            files.map(filename => P.parse(filename).name),
            files.map(
              filename => require(`${process.cwd()}/${this.migrationsFolder}/${syncProviderFolder}/${P.parse(filename).name}`))
          )
        })
      )
      : (this.inlineMigrations || {})
  }

  async migrate(endpointName = 'local') {
    try {
      return await sequential(
        this.migrations
          |> mapValues(async (migrations, syncProviderName) => {
            const syncProvider = this.syncProviders[syncProviderName]
            const endpoint = this.getEndpoint(endpointName, syncProviderName)
            const endpointToString = syncProvider.endpointToString ?? JSON.stringify

            console.log(`Migrating ${endpointToString.call(syncProvider, endpoint)} ...`)

            const executedMigrations = (syncProvider.getExecutedMigrations ?? stubArray)(endpoint)
            const migrationsToExecute = (migrations ?? {}) |> omit(executedMigrations)
            sequential(
              migrationsToExecute
                |> mapValues(async (migration, name) => {
                  console.log(name)
                  migration.up(
                    (syncProvider.getMigrationParams ?? stubObject)(endpoint)
                  ) |> await
                })
                |> values
            ) |> await
            if (syncProvider.setExecutedMigrations !== undefined) {
              return syncProvider.setExecutedMigrations(endpoint, migrations |> keys)
            }
          })
          |> values
      )
    } catch (error) {
      console.error(error.message)
    }
  }
}

