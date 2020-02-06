import { spawn } from 'child-process-promise'
import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'ceiling.config.js': endent`
      module.exports = {
        plugins: ['mysql'],
        endpoints: {
          local: {
            mysql: {
              host: 'local.de',
            },
          },
        },
      }
    `,
    'node_modules/ceiling-plugin-mysql/index.js': endent`
      module.exports = {
        endpointToString: ({ host }) => \`mysql://\${host}\`,
      }
    `,
    'migrations/mysql/1-test.js': endent`
      module.exports = {
        up: ({ host }) => console.log(\`\${host}: up 1\`),
      }
    `,
    'package.json': endent`
      {
        "devDependencies": {
          "ceiling-plugin-mysql": "^1.0.0"
        }
      }
    `,
  })
  const { stdout } = await spawn('ceiling', ['migrate', '-y'], { capture: ['stdout'] })
  expect(stdout).toEqual(endent`
    Migrating mysql://local.de …
     - 1-test
    local.de: up 1

  `)
})
