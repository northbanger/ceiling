import { writeFileSync } from 'fs'
import tmp from 'tmp'
import { endent } from '@functions'
import { spawn } from 'child_process'

describe('cli', () => {

  describe('confirmString', () => {

    it('works', async () => {

      const configFile = tmp.fileSync({ postfix: '.js' })
      writeFileSync(configFile.name, endent`
        module.exports = {
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
        }
      `)
      await spawn('ceiling')
    })
  })
})
