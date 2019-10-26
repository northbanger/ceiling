const _ = require('lodash')
const sequential = require('promise-sequential')
const fs = require('fs')
const path = require('path')

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
    return (this.endpoints[endpointName] || {})[syncProviderName]
  }

  validate(endpoint) {
    _.forIn(this.syncProviders, syncProvider => syncProvider.validate(endpoint))
  }

  _sync(operation, endpointName) {
    if (_.isEmpty(this.syncProviders)) {
      console.log('No sync providers defined. Doing nothing ...')
    }

    return Promise.all(
      _(this.syncProviders)
        .mapValues((syncProvider, syncProviderName) => {
          try {
            if (syncProvider.sync != null) {
              const fromEndpoint = this.getEndpoint(operation == Ceiling.PUSH ? 'local' : endpointName, syncProviderName)
              const toEndpoint = this.getEndpoint(operation == Ceiling.PUSH ? endpointName : 'local', syncProviderName)
              const endpointToString = syncProvider.endpointToString || JSON.stringify

              console.log(`${endpointToString.call(syncProvider, fromEndpoint)} => ${endpointToString.call(syncProvider, toEndpoint)} ...`)
              return syncProvider.sync(fromEndpoint, toEndpoint)
            } else {
              return Promise.resolve()
            }
          } catch (err) {
            return new Promise(({}, reject) => reject(err))
          }
        })
        .values()
        .value()
    )
      .catch(err => console.log(err.message))
  }

  push(endpointName = 'live') {
    return this._sync(Ceiling.PUSH, endpointName)
  }

  pull(endpointName = 'live') {
    return this._sync(Ceiling.PULL, endpointName)
  }

  get migrations() {
    const folders = fs.readdirSync(this.migrationsFolder).filter(folder => !folder.startsWith('.'))
    return (this.migrationsFolder != null && _.isEmpty(this.inlineMigrations))
      ? _.zipObject(
        folders,
        folders.map(syncProviderFolder => {
          const files = fs.readdirSync(`${process.cwd()}/${this.migrationsFolder}/${syncProviderFolder}`)
          return _.zipObject(
            files.map(filename => path.parse(filename).name),
            files.map(
              filename => require(`${process.cwd()}/${this.migrationsFolder}/${syncProviderFolder}/${path.parse(filename).name}`))
          )
        })
      )
      : (this.inlineMigrations || {})
  }

  migrate(endpointName = 'local') {
    return sequential(
      _(this.migrations)
        .mapValues((migrations, syncProviderName) => () => {
          try {
            const syncProvider = this.syncProviders[syncProviderName]
            const endpoint = this.getEndpoint(endpointName, syncProviderName)
            const endpointToString = syncProvider.endpointToString || JSON.stringify
            return Promise.resolve()
              .then(() => console.log(`Migrating ${endpointToString.call(syncProvider, endpoint)} ...`))
              .then(() => syncProvider.getExecutedMigrations != null
                ? syncProvider.getExecutedMigrations(endpoint)
                : Promise.resolve([])
              )
              .then(executedMigrations => _.omit(migrations || {}, executedMigrations))
              .then(migrationsToExecute => sequential(
                _(migrationsToExecute)
                  .mapValues((migration, name) => () => {
                    return Promise.resolve()
                      .then(() => console.log(name))
                      .then(() => migration.up(
                        syncProvider.getMigrationParams != null
                          ? syncProvider.getMigrationParams(endpoint)
                          : {}
                      ))
                  })
                  .values()
                  .value()
                )
              )
              .then(() => {
                if (syncProvider.setExecutedMigrations != null) {
                  return syncProvider.setExecutedMigrations(endpoint, _.keys(migrations))
                }
              })
          } catch (err) {
            return new Promise(({}, reject) => reject(err))
          }
        })
        .values()
        .value()
    )
      .catch(err => console.log(err.message))
  }
}

module.exports = Ceiling
