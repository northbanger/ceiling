#!/usr/bin/env node

import makeCli from 'make-cli'
import Cli from './cli'
import P from 'path'
import findUp from 'find-up'
import Confirm from 'prompt-confirm'

const cli = new Cli({
  config: process.cwd() + '/' + P.relative(process.cwd(), findUp.sync('ceiling.config.js')),
})

/*program.command('ssh <service> [endpoint]')
  .option('-c --cmd [cmd]')
  .description('ssh into the remote of the service')
  .action((serviceName, endpointName, options) => {

    if (!endpointName || endpointName == 'local') {
      spawnSync('docker-compose', ['-p', package.name, 'exec', serviceName, options.cmd ? options.cmd : 'bash'], { stdio: 'inherit' });
    } else {
      var host = config.val(`endpoints.${endpointName}.${serviceName}.sshHost`);
      var user = config.val(`endpoints.${endpointName}.${serviceName}.sshUser`);
      spawnSync('ssh', [`${user}@${host}`, ...(options.cmd ? [options.cmd] : [])], { stdio: 'inherit' });
    }
  });*/

const confirm = async (fromEndpointName, toEndpointName, options) => options.yes
  ? true
  : await (new Confirm(cli.confirmString(fromEndpointName, toEndpointName))).run()

makeCli({
  commands: [
    {
      name: 'push <endpoint>',
      description: 'Push data to an endpoint or to all endpoints',
      options: [
        {
          name: '-y, --yes',
          description: 'do not ask for confirmation',
        },
      ],
      action: (endpointName, options) => confirm('local', endpointName, options).then(yes => {
        if (yes) {
          cli.push(endpointName)
        }
      }),
    },
    {
      name: 'pull <endpoint>',
      description: 'Pull data from an endpoint or from all endpoints',
      options: [
        {
          name: '-y, --yes',
          description: 'do not ask for confirmation',
        },
      ],
      action: (endpointName, options) => confirm(endpointName, 'local', options).then(yes => {
        if (yes) {
          cli.pull(endpointName)
        }
      }),
    },
    {
      name: 'migrate <endpoint>',
      description: 'Migrate data at an endpoint',
      options: [
        {
          name: '-y, --yes',
          description: 'do not ask for confirmation',
        },
      ],
      action: endpointName => cli.migrate(endpointName),
    },
  ],
})
