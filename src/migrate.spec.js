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
    const childProcess = execa.command('ceiling migrate')
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
  }),
  'executed migrations set': () => withLocalTmpDir(async () => {
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
    const { all } = await execa.command('ceiling migrate -y', { all: true })
    expect(all).toEqual(endent`
      Migrating undefined …
       - 1-test
      up 1
      Added executed migrations 1-test
    `)
  }),
  'executed migrations': () => withLocalTmpDir(async () => {
    await outputFiles({
      'ceiling.config.js': endent`
        module.exports = {
          plugins: ['mysql'],
        }
      `,
      'node_modules/ceiling-plugin-mysql/index.js': endent`
        module.exports = {
          getExecutedMigrations: () => ['1-test'],
        }
      `,
      'migrations/mysql': {
        '1-test.js': endent`
          module.exports = {
            up: () => console.log('up 1'),
          }
        `,
        '2-test2.js': endent`
          module.exports = {
            up: () => console.log('up 2'),
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
    const { all } = await execa.command('ceiling migrate -y', { all: true })
    expect(all).toEqual(endent`
      Migrating undefined …
       - 2-test2
      up 2
    `)
  }),
  'no migrations': () => withLocalTmpDir(async () => {
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
    const { all } = await execa.command('ceiling migrate -y', { all: true })
    expect(all).toEqual('')
  }),
  'no plugins': () => withLocalTmpDir(async () => {
    const { all } = await execa.command('ceiling migrate -y', { all: true })
    expect(all).toEqual('No plugins specified. Doing nothing …')
  }),
  'two plugins': () => withLocalTmpDir(async () => {
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
    const { all } = await execa.command('ceiling migrate -y', { all: true })
    expect(all).toEqual(endent`
      Migrating mongodb://mongodb-local.de …
       - 1-test
      mongodb-local.de: mongodb up 1
      Migrating mysql://mysql-local.de …
       - 1-test
      mysql-local.de: mysql up 1
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
    const { all } = await execa.command('ceiling migrate -y', { all: true })
    expect(all).toEqual(endent`
      Migrating mysql://local.de …
       - 1-test
      local.de: up 1
    `)
  }),
}
