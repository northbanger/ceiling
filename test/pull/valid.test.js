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
          live: {
            mysql: {
              host: 'live.de',
            },
          },
        },
      }
    `,
    'node_modules/ceiling-plugin-mysql/index.js': endent`
      module.exports = {
        endpointToString: ({ host }) => \`mysql://\${host}\`,
        sync: (from, to) => {
          console.log(from)
          console.log(to)
        },
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
  const { stdout } = await spawn('ceiling', ['pull', '-y'], { capture: ['stdout'] })
  expect(stdout).toEqual(endent`
    mysql://live.de => mysql://local.de …
    { host: 'live.de' }
    { host: 'local.de' }

  `)
})
