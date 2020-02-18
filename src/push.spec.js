import execa from 'execa'
import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import stripAnsi from 'strip-ansi'

export default {
  confirm: () => withLocalTmpDir(async () => {
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
    const childProcess = execa.command('ceiling push')
    let stdout
    await new Promise(resolve => childProcess.stdout.on('data', data => {
      stdout = data.toString()
      childProcess.stdin.write('y\n')
      resolve()
    }))
    expect(stdout |> stripAnsi).toEqual(endent`
      ? Are you sure you want to …
       - mongodb://mongodb-local.de => mongodb://mongodb-live.de
       - mysql://mysql-local.de => mysql://mysql-live.de
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
  }),
  'no endpointToString': () => withLocalTmpDir(async () => {
    await outputFiles({
      'ceiling.config.js': endent`
        module.exports = {
          plugins: ['mysql'],
        }
      `,
      'node_modules/ceiling-plugin-mysql/index.js': endent`
        module.exports = {
          sync: () => {},
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
    const { all } = await execa.command('ceiling push -y', { all: true })
    expect(all).toEqual('undefined => undefined …')
  }),
  'no plugins': () => withLocalTmpDir(async () => {
    const { all } = await execa.command('ceiling push -y', { all: true })
    expect(all).toEqual('No plugins specified. Doing nothing …')
  }),
  'no sync': () => withLocalTmpDir(async () => {
    await outputFiles({
      'ceiling.config.js': endent`
        module.exports = {
          plugins: ['mysql'],
        }
      `,
      'node_modules/ceiling-plugin-mysql/index.js': endent`
        module.exports = {}
      `,
      'package.json': endent`
        {
          "devDependencies": {
            "ceiling-plugin-mysql": "^1.0.0"
          }
        }
      `,
    })
    const { all } = await execa.command('ceiling push -y', { all: true })
    expect(all).toEqual('undefined => undefined …')
  }),
  'two plugins': () => withLocalTmpDir(async () => {
    await outputFiles({
      'ceiling.config.js': endent`
        module.exports = {
          plugins: ['mysql', 'mongodb'],
          endpoints: {
            local: {
              mysql: {
                host: 'mysql-local.de',
              },
              mongodb: {
                host: 'mongodb-local.de',
              },
            },
            live: {
              mysql: {
                host: 'mysql-live.de',
              },
              mongodb: {
                host: 'mongodb-live.de',
              },
            },
          },
        }
      `,
      node_modules: {
        'ceiling-plugin-mysql/index.js': endent`
          module.exports = {
            endpointToString: ({ host }) => \`mysql://\${host}\`,
            sync: (from, to) => {
              console.log(from)
              console.log(to)
            },
          }
        `,
        'ceiling-plugin-mongodb/index.js': endent`
          module.exports = {
            endpointToString: ({ host }) => \`mongodb://\${host}\`,
            sync: (from, to) => {
              console.log(from)
              console.log(to)
            },
          }
        `,
      },
      'package.json': endent`
        {
          "devDependencies": {
            "ceiling-plugin-mysql": "^1.0.0",
            "ceiling-plugin-mongodb": "^1.0.0"
          }
        }
      `,
    })
    const { all } = await execa.command('ceiling push -y', { all: true })
    expect(all).toEqual(endent`
      mysql://mysql-local.de => mysql://mysql-live.de …
      { host: 'mysql-local.de' }
      { host: 'mysql-live.de' }
      mongodb://mongodb-local.de => mongodb://mongodb-live.de …
      { host: 'mongodb-local.de' }
      { host: 'mongodb-live.de' }
    `)
  }),
  valid: () => withLocalTmpDir(async () => {
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
    const { all } = await execa.command('ceiling push -y', { all: true })
    expect(all).toEqual(endent`
      mysql://local.de => mysql://live.de …
      { host: 'local.de' }
      { host: 'live.de' }
    `)
  }),
}
