const Ceiling = require('./ceiling')
const stdout = require("test-console").stdout
const consoleMock = require('console-mock2')

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
      expect(stdout.inspectSync(() => ceiling.push('live'))).toEqual([
        'undefined => undefined ...\n',
        `Sync function missing for sync provider 'mysql'. Doing nothing ...\n`
      ])
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
      expect(stdout.inspectSync(() => ceiling.pull('live'))).toEqual([
        'undefined => undefined ...\n',
        `Sync function missing for sync provider 'mysql'. Doing nothing ...\n`
      ])
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
            sync(from, to) {
              return new Promise((resolve, reject) => reject(new Error('foo')))
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
})
