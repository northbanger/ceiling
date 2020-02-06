import { spawn } from 'child-process-promise'
import withLocalTmpDir from 'with-local-tmp-dir'
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
        },
      }
    `,
    node_modules: {
      'ceiling-plugin-mongodb/index.js': endent`
        module.exports = {
          endpointToString: ({ host }) => \`mongodb://\${host}\`,
        }
      `,
      'ceiling-plugin-mysql/index.js': endent`
        module.exports = {
          endpointToString: ({ host }) => \`mysql://\${host}\`,
        }
      `,
    },
    migrations: {
      'mongodb/1-test.js': endent`
        module.exports = {
          up: ({ host }) => console.log(\`\${host}: mongodb up 1\`),
        }
      `,
      'mysql/1-test.js': endent`
        module.exports = {
          up: ({ host }) => console.log(\`\${host}: mysql up 1\`),
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
  const childProcess = spawn('ceiling', ['migrate']).childProcess
  let stdout
  await new Promise(resolve => childProcess.stdout.on('data', data => {
    stdout = data.toString()
    childProcess.stdin.write('y\n')
    resolve()
  }))
  expect(stdout |> stripAnsi).toEqual(endent`
    ? Are you sure you want to …
    mongodb://mongodb-local.de
     - 1-test
    mysql://mysql-local.de
     - 1-test
     (y/N)${' '}
  `)
  childProcess.stdout.removeAllListeners('data')
  await new Promise(resolve => childProcess.stdout.on('data', data => {
    stdout += data.toString()
    if (stdout.includes('mongodb-local.de: mongodb up 1\n')
      && stdout.includes('mysql-local.de: mysql up 1\n')
    ) {
      resolve()
    }
  }))
  childProcess.stdout.removeAllListeners('data')
})
