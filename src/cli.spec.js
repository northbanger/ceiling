const Cli = require('./cli')
const fs = require('fs')
const tmp = require('tmp')
const path = require('path')

describe('cli', () => {

  describe('confirmString', () => {

    it('works', () => {

      const configFile = tmp.fileSync({ postfix: '.js' })
      fs.writeFileSync(configFile.name,
`module.exports = {
  syncProviders: {
    mysql: {
      endpointToString(endpoint) {
        return endpoint.host
      }
    }
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
    }
  }
}`    )
      const cli = new Cli({
        config: configFile.name
      })
      expect(cli.confirmString('local', 'live')).toEqual('Are you sure you want to ...\n - local.de => live.de\n')
    })
  })
})
