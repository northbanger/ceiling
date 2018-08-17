const Ceiling = require('./ceiling')
const stdout = require("test-console").stdout
const _ = require('lodash')

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
            sync(from, to) {
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

    it('no providers', () => {
      const ceiling = new Ceiling()
      expect(stdout.inspectSync(() => ceiling.pull())).toEqual([
        'No sync providers defined. Doing nothing ...\n'
      ])
    })

    it('one sync provider with missing migrate', () => {
      const ceiling = new Ceiling({
        syncProviders: {
          mysql: {},
        },
      })
      expect(stdout.inspectSync(() => ceiling.migrate('local'))).toEqual([])
    })

    it('one sync provider', () => {
      const ceiling = new Ceiling({
        migrations: {
          mysql: {
            1: {
              up() {
                console.log('Migrating 1')
              }
            }
          }
        },
        syncProviders: {
          mysql: {
            endpointToString(endpoint) {
              return `mysql://${endpoint.host}`
            },
            migrate(endpoint, migrations) {
              expect(endpoint).toEqual({ host: 'local.de' })
              _.forIn(migrations, migration => migration.up())
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
      expect(stdout.inspectSync(() => ceiling.migrate('local'))).toEqual([
        'Migrating mysql://local.de ...\n',
        'Migrations to execute: 1\n',
        'Migrating 1\n'
      ])
    })

    it('two sync providers', () => {
      const ceiling = new Ceiling({
        migrations: {
          mysql: {
            1: {
              up() {
                console.log('Migrating mysql 1')
              }
            }
          },
          mongodb: {
            1: {
              up() {
                console.log('Migrating mongodb 1')
              }
            }
          }
        },
        syncProviders: {
          mysql: {
            endpointToString(endpoint) {
              return `mysql://${endpoint.host}`
            },
            migrate({}, migrations) {
              _.forIn(migrations, migration => migration.up())
            }
          },
          mongodb: {
            endpointToString(endpoint) {
              return `mongodb://${endpoint.host}`
            },
            migrate({}, migrations) {
              _.forIn(migrations, migration => migration.up())
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
        }
      })
      expect(stdout.inspectSync(() => ceiling.migrate('local'))).toEqual([
        'Migrating mysql://mysql-local.de ...\n',
        'Migrations to execute: 1\n',
        'Migrating mysql 1\n',
        'Migrating mongodb://mongodb-local.de ...\n',
        'Migrations to execute: 1\n',
        'Migrating mongodb 1\n',
      ])
    })

    it('error inside sync provider sync', done => {
      const ceiling = new Ceiling({
        migrations: {
          mysql: {
            1: {
              up() {
              }
            }
          },
        },
        syncProviders: {
          mysql: {
            migrate() {
              throw new Error('foo')
            }
          },
        },
      })
      const inspect = stdout.inspect()
      ceiling.migrate('local')
        .then(() => {
          inspect.restore()
          expect(inspect.output).toEqual([
            'Migrating undefined ...\n',
            'Migrations to execute: 1\n',
            'foo\n',
          ])
        })
        .then(done)
    })

    it('error inside sync provider async', done => {
      const ceiling = new Ceiling({
        migrations: {
          mysql: {
            1: {
              up() {
              }
            }
          },
        },
        syncProviders: {
          mysql: {
            migrate() {
              return new Promise(({}, reject) => reject(new Error('foo')))
            }
          },
        },
      })
      const inspect = stdout.inspect()
      ceiling.migrate('local')
        .then(() => {
          inspect.restore()
          expect(inspect.output).toEqual([
            'Migrating undefined ...\n',
            'Migrations to execute: 1\n',
            'foo\n',
          ])
        })
        .then(done)
    })

    it('no migrations to execute', done => {
      const ceiling = new Ceiling({
        syncProviders: {
          mysql: {
            migrate() {},
          },
        },
      })
      const inspect = stdout.inspect()
      ceiling.migrate('local')
        .then(() => {
          inspect.restore()
          expect(inspect.output).toEqual([
            'Migrating undefined ...\n',
            'Migrations to execute: none\n',
          ])
        })
        .then(done)
    })

    it('executed migrations', done => {
      const ceiling = new Ceiling({
        migrations: {
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
            migrate(endpoint, migrations) {
              _.forIn(migrations, migration => migration.up())
            },
            getExecutedMigrations() {
              return [1]
            }
          },
        },
      })
      const inspect = stdout.inspect()
      ceiling.migrate('local')
        .then(() => {
          inspect.restore()
          expect(inspect.output).toEqual([
            'Migrating undefined ...\n',
            'Migrations to execute: 2\n',
            'up 2\n',
          ])
        })
        .then(done)
    })
  })
})
