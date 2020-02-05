import { spawn } from 'child-process-promise'
import withLocalTmpDir from 'with-local-tmp-dir'
import expect from 'expect'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import stripAnsi from 'strip-ansi'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'ceiling.config.js': endent`
      module.exports = {
        plugins: ['mongodb', 'mysql'],
        endpoints: {
          local: {
            mongodb: {
              host: 'mongodb-local.de',
            },
            mysql: {
              host: 'mysql-local.de',
            },
          },
          live: {
            mongodb: {
              host: 'mongodb-live.de',
            },
            mysql: {
              host: 'mysql-live.de',
            },
          },
        },
      }
    `,
    node_modules: {
      'ceiling-plugin-mongodb/index.js': endent`
        module.exports = {
          endpointToString: ({ host }) => \`mongodb://\${host}\`,
          sync: () => console.log('synced mongodb'),
        }
      `,
      'ceiling-plugin-mysql/index.js': endent`
        module.exports = {
          endpointToString: ({ host }) => \`mysql://\${host}\`,
          sync: () => console.log('synced mysql'),
        }
      `,
    },
    'package.json': endent`
      {
        "devDependencies": {
          "ceiling-plugin-mongodb": "^1.0.0",
          "ceiling-plugin-mysql": "^1.0.0"
        }
      }
    `,
  })
  const childProcess = spawn('ceiling', ['pull']).childProcess
  let stdout
  await new Promise(resolve => childProcess.stdout.on('data', data => {
    stdout = data.toString()
    childProcess.stdin.write('y\n')
    resolve()
  }))
  expect(stdout |> stripAnsi).toEqual(endent`
    ? Are you sure you want to …
     - mongodb://mongodb-live.de => mongodb://mongodb-local.de
     - mysql://mysql-live.de => mysql://mysql-local.de
     (y/N)${' '}
  `)
  childProcess.stdout.removeAllListeners('data')
  await new Promise(resolve => childProcess.stdout.on('data', data => {
    stdout += data.toString()
    if (stdout.includes('synced mongodb\n')
      && stdout.includes('synced mysql\n')
    ) {
      resolve()
    }
  }))
  childProcess.stdout.removeAllListeners('data')
})
