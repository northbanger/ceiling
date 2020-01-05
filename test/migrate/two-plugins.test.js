import { spawn } from 'child-process-promise'
import withLocalTmpDir from 'with-local-tmp-dir'
import expect from 'expect'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'

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
  const { stdout } = await spawn('ceiling', ['migrate', '-y'], { capture: ['stdout'] })
  expect(stdout).toEqual(endent`
    Migrating mongodb://mongodb-local.de …
     - 1-test
    mongodb-local.de: mongodb up 1
    Migrating mysql://mysql-local.de …
     - 1-test
    mysql-local.de: mysql up 1

  `)
})
