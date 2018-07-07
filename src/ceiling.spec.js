const Ceiling = require('./ceiling')
const NoProvidersError = require('./no-providers-error')
const EndpointNotFoundError = require('./endpoint-not-found-error')
const stdout = require("test-console").stdout

describe('Ceiling', () => {

  describe('push', () => {

    it('no providers', () => {
      const ceiling = new Ceiling()
      expect(() => ceiling.push()).toThrow(new NoProvidersError())
    })

    it('local endpoint missing', () => {
      const ceiling = new Ceiling({
        syncProviders: {
          foo: {},
        }
      })
      expect(() => ceiling.push()).toThrow(new EndpointNotFoundError('local'))
    })

    it('remote endpoint missing', () => {
      const ceiling = new Ceiling({
        syncProviders: {
          foo: {},
        },
        endpoints: {
          local: {},
        }
      })
      expect(() => ceiling.push('remote')).toThrow(new EndpointNotFoundError('remote'))
    })

    it('remote endpoint missing', () => {
      const ceiling = new Ceiling({
        syncProviders: {
          foo: {},
        },
        endpoints: {
          local: {},
        }
      })
      expect(() => ceiling.push('live')).toThrow(new EndpointNotFoundError('live'))
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
      expect(() => ceiling.pull()).toThrow(new NoProvidersError())
    })

    it('local endpoint missing', () => {
      const ceiling = new Ceiling({
        syncProviders: {
          foo: {},
        },
        endpoints: {
          live: {},
        }
      })
      expect(() => ceiling.pull('live')).toThrow(new EndpointNotFoundError('local'))
    })

    it('remote endpoint missing', () => {
      const ceiling = new Ceiling({
        syncProviders: {
          foo: {},
        },
      })
      expect(() => ceiling.pull('live')).toThrow(new EndpointNotFoundError('live'))
    })

    it('remote endpoint missing', () => {
      const ceiling = new Ceiling({
        syncProviders: {
          foo: {},
        },
        endpoints: {
          local: {},
        }
      })
      expect(() => ceiling.pull('live')).toThrow(new EndpointNotFoundError('live'))
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
  })
})
