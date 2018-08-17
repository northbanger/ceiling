const Ceiling = require('./ceiling')
const stdout = require("test-console").stdout
const _ = require('lodash')
const mockfs = require('mock-fs')
const fs = require('fs')

describe('Ceiling', () => {

  describe('push', () => {

    it('no providers', () => {
      const ceiling = new Ceiling()
      expect(stdout.inspectSync(() => ceiling.push())).toEqual([
        'No sync providers defined. Doing nothing ...\n'
      ])
    })

    it('one sync provider with missing endpointToString', () => {
      const ceiling = new Ceiling({
        syncProviders: {
          mysql: {
            sync() {
            }
          },
        },
      })
      expect(stdout.inspectSync(() => ceiling.push('live'))).toEqual([
        'undefined => undefined ...\n'
      ])
    })

    it('one sync provider with missing sync', () => {
      const ceiling = new Ceiling({
        syncProviders: {
          mysql: {},
        },
      })
      expect(stdout.inspectSync(() => ceiling.push('live'))).toEqual([])
    })

    it('one sync provider', () => {
      var data = 0
      const ceiling = new Ceiling({
        syncProviders: {
          mysql: {
            endpointToString(endpoint) {
              return `mysql://${endpoint.host}`
            },
            sync(from, to) {
              expect(from).toEqual({ host: 'local.de' })
              expect(to).toEqual({ host: 'live.de' })
              data++
            }
          },
        },
        endpoints: {
          local: {
            mysql: {
              host: 'local.de'
            }
          },
          live: {
            mysql: {
              host: 'live.de'
            }
          },
        }
      })
      expect(stdout.inspectSync(() => ceiling.push('live'))).toEqual(['mysql://local.de => mysql://live.de ...\n'])
      expect(data).toEqual(1)
    })

    it('two sync providers', () => {
      var data = 0
      const ceiling = new Ceiling({
        syncProviders: {
          mysql: {
            endpointToString(endpoint) {
              return `mysql://${endpoint.host}`
            },
            sync(from, to) {
              expect(from).toEqual({ host: 'mysql-local.de' })
              expect(to).toEqual({ host: 'mysql-live.de' })
              data++
            }
          },
          mongodb: {
            endpointToString(endpoint) {
              return `mongodb://${endpoint.host}`
            },
            sync(from, to) {
              expect(from).toEqual({ host: 'mongodb-local.de' })
              expect(to).toEqual({ host: 'mongodb-live.de' })
              data++
            }
          },
        },
        endpoints: {
          local: {
            mysql: {
              host: 'mysql-local.de'
            },
            mongodb: {
              host: 'mongodb-local.de'
            }
          },
          live: {
            mysql: {
              host: 'mysql-live.de'
            },
            mongodb: {
              host: 'mongodb-live.de'
            }
          },
        }
      })
      expect(stdout.inspectSync(() => ceiling.push('live'))).toEqual([
        'mysql://mysql-local.de => mysql://mysql-live.de ...\n',
        'mongodb://mongodb-local.de => mongodb://mongodb-live.de ...\n'
      ])
      expect(data).toEqual(2)
    })
  })

  describe('pull', () => {

    it('no providers', () => {
      const ceiling = new Ceiling()
      expect(stdout.inspectSync(() => ceiling.pull())).toEqual([
        'No sync providers defined. Doing nothing ...\n'
      ])
    })

    it('one sync provider with missing sync', () => {
      const ceiling = new Ceiling({
        syncProviders: {
          mysql: {},
        },
      })
      expect(stdout.inspectSync(() => ceiling.pull('live'))).toEqual([])
    })

    it('one sync provider', () => {
      var data = 0
      const ceiling = new Ceiling({
        syncProviders: {
          mysql: {
            endpointToString(endpoint) {
              return `mysql://${endpoint.host}`
            },
            sync(from, to) {
              expect(from).toEqual({ host: 'live.de' })
              expect(to).toEqual({ host: 'local.de' })
              data++
            }
          },
        },
        endpoints: {
          local: {
            mysql: {
              host: 'local.de'
            }
          },
          live: {
            mysql: {
              host: 'live.de'
            }
          },
        }
      })
      expect(stdout.inspectSync(() => ceiling.pull('live'))).toEqual(['mysql://live.de => mysql://local.de ...\n'])
      expect(data).toEqual(1)
    })

    it('two sync providers', () => {
      var data = 0
      const ceiling = new Ceiling({
        syncProviders: {
          mysql: {
            endpointToString(endpoint) {
              return `mysql://${endpoint.host}`
            },
            sync(from, to) {
              data++
            }
          },
          mongodb: {
            endpointToString(endpoint) {
              return `mongodb://${endpoint.host}`
            },
            sync(from, to) {
              data++
            }
          },
        },
        endpoints: {
          local: {
            mysql: {
              host: 'mysql-local.de'
            },
            mongodb: {
              host: 'mongodb-local.de'
            }
          },
          live: {
            mysql: {
              host: 'mysql-live.de'
            },
            mongodb: {
              host: 'mongodb-live.de'
            }
          },
        }
      })
      expect(stdout.inspectSync(() => ceiling.pull('live'))).toEqual([
        'mysql://mysql-live.de => mysql://mysql-local.de ...\n',
        'mongodb://mongodb-live.de => mongodb://mongodb-local.de ...\n'
      ])
      expect(data).toEqual(2)
    })

    it('error inside sync provider sync', done => {
      const ceiling = new Ceiling({
        syncProviders: {
          mysql: {
            sync() {
              throw new Error('foo')
            }
          },
        },
      })
      const inspect = stdout.inspect()
      ceiling.pull('live')
        .then(() => {
          inspect.restore()
          expect(inspect.output).toEqual([
            'undefined => undefined ...\n',
            'foo\n',
          ])
        })
        .then(done)
    })

    it('error inside sync provider async', done => {
      const ceiling = new Ceiling({
        syncProviders: {
          mysql: {
            sync() {
              return new Promise(({}, reject) => reject(new Error('foo')))
            }
          },
        },
      })
      const inspect = stdout.inspect()
      ceiling.pull('live')
        .then(() => {
          inspect.restore()
          expect(inspect.output).toEqual([
            'undefined => undefined ...\n',
            'foo\n',
          ])
        })
        .then(done)
    })
  })

  describe('migrate', () => {

    it('no providers', done => {
      const ceiling = new Ceiling()
      const inspect = stdout.inspect()
      ceiling.migrate()
        .then(() => inspect.restore())
        .then(() => expect(inspect.output).toEqual([]))
        .then(done)
    })

    it('no migrations', done => {
      const ceiling = new Ceiling({
        syncProviders: {
          mysql: {},
        },
      })
      const inspect = stdout.inspect()
      ceiling.migrate('local')
        .then(() => inspect.restore())
        .then(() => expect(inspect.output).toEqual([]))
        .then(done)
    })

    it('one sync provider', done => {
      const ceiling = new Ceiling({
        inlineMigrations: {
          mysql: {
            1: {
              up({ db }) {
                expect(db).toEqual('db')
                console.log('up 1')
              }
            },
          }
        },
        syncProviders: {
          mysql: {
            endpointToString(endpoint) {
              return `mysql://${endpoint.host}`
            },
            getMigrationParams(endpoint) {
              expect(endpoint).toEqual({ host: 'local.de' })
              return { db: 'db' }
            },
          },
        },
        endpoints: {
          local: {
            mysql: {
              host: 'local.de'
            }
          },
        }
      })
      const inspect = stdout.inspect()
      ceiling.migrate('local')
        .then(() => inspect.restore())
        .then(() => expect(inspect.output).toEqual([
          'Migrating mysql://local.de ...\n',
          '1\n',
          'up 1\n',
        ]))
        .then(done)
    })

    it('two sync providers', done => {
      const ceiling = new Ceiling({
        inlineMigrations: {
          mysql: {
            1: {
              up() {
                console.log('mysql up 1')
              }
            }
          },
          mongodb: {
            1: {
              up() {
                console.log('mongodb up 1')
              }
            }
          }
        },
        syncProviders: {
          mysql: {
            endpointToString(endpoint) {
              return `mysql://${endpoint.host}`
            },
          },
          mongodb: {
            endpointToString(endpoint) {
              return `mongodb://${endpoint.host}`
            },
          },
        },
        endpoints: {
          local: {
            mysql: {
              host: 'mysql-local.de'
            },
            mongodb: {
              host: 'mongodb-local.de'
            }
          },
        }
      })
      const inspect = stdout.inspect()
      ceiling.migrate('local')
        .then(() => inspect.restore())
        .then(() => expect(inspect.output).toEqual([
          'Migrating mysql://mysql-local.de ...\n',
          '1\n',
          'mysql up 1\n',
          'Migrating mongodb://mongodb-local.de ...\n',
          '1\n',
          'mongodb up 1\n',
        ]))
        .then(done)
    })

    it('error inside sync provider sync', done => {
      const ceiling = new Ceiling({
        inlineMigrations: {
          mysql: {
            1: {
              up() {
                throw new Error('foo')
              }
            }
          },
        },
        syncProviders: {
          mysql: {},
        },
      })
      const inspect = stdout.inspect()
      ceiling.migrate('local')
        .then(() => inspect.restore())
        .then(() => expect(inspect.output).toEqual([
          'Migrating undefined ...\n',
          '1\n',
          'foo\n',
        ]))
        .then(done)
    })

    it('error inside sync provider async', done => {
      const ceiling = new Ceiling({
        inlineMigrations: {
          mysql: {
            1: {
              up() {
                return new Promise(({}, reject) => reject(new Error('foo')))
              }
            }
          },
        },
        syncProviders: {
          mysql: {},
        },
      })
      const inspect = stdout.inspect()
      ceiling.migrate('local')
        .then(() => inspect.restore())
        .then(() => expect(inspect.output).toEqual([
          'Migrating undefined ...\n',
          '1\n',
          'foo\n',
        ]))
        .then(done)
    })

    it('executed migrations', done => {
      const ceiling = new Ceiling({
        inlineMigrations: {
          mysql: {
            1: {
              up() {
                console.log('up 1')
              }
            },
            2: {
              up() {
                console.log('up 2')
              }
            }
          }
        },
        syncProviders: {
          mysql: {
            getExecutedMigrations() {
              return [1]
            }
          },
        },
      })
      const inspect = stdout.inspect()
      ceiling.migrate('local')
        .then(() => inspect.restore())
        .then(() => expect(inspect.output).toEqual([
          'Migrating undefined ...\n',
          '2\n',
          'up 2\n',
        ]))
        .then(done)
    })

    it('sequential', done => {
      const ceiling = new Ceiling({
        inlineMigrations: {
          mysql: {
            1: {
              up() {
                return new Promise(resolve => setTimeout(resolve))
                  .then(() => console.log('up 1'))
              }
            },
            2: {
              up() {
                console.log('up 2')
              }
            },
          }
        },
        syncProviders: {
          mysql: {
            endpointToString(endpoint) {
              return `mysql://${endpoint.host}`
            },
            getMigrationParams(endpoint) {
              expect(endpoint).toEqual({ host: 'local.de' })
              return { db: 'db' }
            },
          },
        },
        endpoints: {
          local: {
            mysql: {
              host: 'local.de'
            }
          },
        }
      })
      const inspect = stdout.inspect()
      ceiling.migrate('local')
        .then(() => inspect.restore())
        .then(() => expect(inspect.output).toEqual([
          'Migrating mysql://local.de ...\n',
          '1\n',
          'up 1\n',
          '2\n',
          'up 2\n',
        ]))
        .then(done)
    })

    it('setExecutedMigrations', done => {
      const ceiling = new Ceiling({
        inlineMigrations: {
          mysql: {
            1: {
              up() {
                console.log('up 1')
              }
            },
          }
        },
        syncProviders: {
          mysql: {
            endpointToString(endpoint) {
              return `mysql://${endpoint.host}`
            },
            setExecutedMigrations(endpoint, migrations) {
              console.log(`Executed migrations set to ${migrations.join(', ')}`)
            }
          },
        },
        endpoints: {
          local: {
            mysql: {
              host: 'local.de'
            }
          },
        }
      })
      const inspect = stdout.inspect()
      ceiling.migrate('local')
        .then(() => inspect.restore())
        .then(() => expect(inspect.output).toEqual([
          'Migrating mysql://local.de ...\n',
          '1\n',
          'up 1\n',
          'Executed migrations set to 1\n',
        ]))
        .then(done)
    })

    it('migrations folder without inline migrations', done => {
      const ceiling = new Ceiling({
        migrationsFolder: __dirname + '/migrations',
        syncProviders: {
          mysql: {
            endpointToString(endpoint) {
              return `mysql://${endpoint.host}`
            },
          },
        },
        endpoints: {
          local: {
            mysql: {
              host: 'local.de'
            }
          },
        }
      })
      const inspect = stdout.inspect()
      ceiling.migrate('local')
        .then(() => inspect.restore())
        .then(() => expect(inspect.output).toEqual([
          'Migrating mysql://local.de ...\n',
          '1\n',
          'up 1\n',
        ]))
        .then(done)
    })
  })
})
