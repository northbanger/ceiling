import { spawn } from 'child-process-promise'
import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'ceiling.config.js': endent`
      module.exports = {
        plugins: ['mysql'],
      }
    `,
    'node_modules/ceiling-plugin-mysql/index.js': endent`
      module.exports = {
        addExecutedMigrations: (endpoint, migrations) => console.log(\`Added executed migrations \${migrations.join(',')}\`),
      }
    `,
    'migrations/mysql': {
      '1-test.js': endent`
        module.exports = {
          up: () => console.log('up 1'),
        }
      `,
    },
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
    Migrating undefined …
     - 1-test
    up 1
    Added executed migrations 1-test

  `)
})
