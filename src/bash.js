#!/usr/bin/env node

const program = require('commander')
const Cli = require('./cli')
const path = require('path')
const findUp = require('find-up')
const Confirm = require('prompt-confirm')

const cli = new Cli({
  config: process.cwd() + '/' + path.relative(process.cwd(), findUp.sync('ceiling.config.js'))
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

function confirm(fromEndpointName, toEndpointName, options) {
  if (options.yes) {
    return Promise.resolve(true)
  } else {
    const confirmMessage = new Confirm(cli.confirmString(fromEndpointName, toEndpointName))
    return confirmMessage.run()
  }
}

program.command('push <endpoint>')
  .description('Push data to an endpoint or to all endpoints')
  .option('-y, --yes', 'do not ask for confirmation')
  .action((endpointName, options) => confirm('local', endpointName, options).then(yes => {
    if (yes) {
      cli.push(endpointName)
    }
  }))

program.command('pull <endpoint>')
  .description('Pull data from an endpoint or from all endpoints')
  .option('-y, --yes', 'do not ask for confirmation')
  .action((endpointName, options) => confirm(endpointName, 'local', options).then(yes => {
    if (yes) {
      cli.pull(endpointName)
    }
  }))

program.command('migrate <endpoint>')
  .description('Migrate data at an endpoint')
  .option('-y, --yes', 'do not ask for confirmation')
  .action(endpointName => cli.migrate(endpointName))

if (!process.argv.slice(2).length || !program.commands.find((command) => command.name() == process.argv[2])) {
  program.outputHelp();
}

program.parse(process.argv)
