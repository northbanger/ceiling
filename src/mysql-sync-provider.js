const SyncProvider = require('./sync-provider');
const mysqldumpSearchReplace = require('mysqldump-search-replace');
const packageJson = require(`${process.cwd()}/package.json`);

class MysqlSyncProvider extends SyncProvider {

  constructor(config, dryRun = false) {
    super(config, dryRun);
  }

  mysql(endpointName, serviceName, command, mysqlCommand = 'mysql') {
    const service = this.config.val(`endpoints.${endpointName}.${serviceName}`);
    if (endpointName == 'local') {
      this.exec(`docker exec -i ${packageJson.name}_${service.val('dbHost')}_1 ${mysqlCommand} -u "${service.val('dbUser')}" -p${service.val('dbPassword')} ${command}`);
    } else {
      this.exec(`export MYSQL_PWD="${service.val('dbPassword')}"; ${mysqlCommand} -u "${service.val('dbUser')}" --host="${service.val('dbHost')}" --port=${service.val('dbPort')} ${command}`);
    }
  }

  fullUrl(service) {
    return `${service.val('urlScheme')}${service.val('urlHost')}${service.val('urlPort') != 80 ? `:${service.val('urlPort')}` : ''}`;
  }

  databaseUrl(endpointName, serviceName) {
    var service = this.config.val(`endpoints.${endpointName}.${serviceName}`);
    var result = `mysql://${service.val('dbHost')}`;
    if (service.val('dbPort') != 3306) {
      result += `:${service.val('dbPort')}`;
    }
    result += `/${service.val('dbName')}`;
    return result;
  }

  executeSub(fromEndpointName, toEndpointName, serviceName) {
    const from = this.config.val(`endpoints.${fromEndpointName}.${serviceName}`);
    const to = this.config.val(`endpoints.${toEndpointName}.${serviceName}`);
    const fromDbUrl = this.databaseUrl(fromEndpointName, serviceName);
    const toDbUrl = this.databaseUrl(toEndpointName, serviceName);
    var dumpFilename = this.tempfile();

    console.log(`Dumping database '${fromDbUrl}' ...`);
    this.mysql(fromEndpointName, serviceName, `${from.val('dbName')} > ${dumpFilename}`, 'mysqldump');

    console.log(`Replacing base urls '${this.fullUrl(from)}' > '${this.fullUrl(to)}' ...`);
    var content = this.readFile(dumpFilename);

    if (this.config.hasKey(`sync.${serviceName}.mysql.replaceUrls`) &&
      this.config.val(`sync.${serviceName}.mysql.replaceUrls`)) {
      this.commands.push('Replacing urls');
      content = mysqldumpSearchReplace(content, this.fullUrl(from), this.fullUrl(to));
    }

    if (this.dryRun) {
      this.commands.push(`Writing file ${dumpFilename}`);
    } else {
      this.readFile(dumpFilename, content);
    }

    console.log(`Dropping database '${toDbUrl}' ...`);
    this.mysql(toEndpointName, serviceName, `-e "DROP DATABASE ${to.val('dbName')}";`);
    this.mysql(toEndpointName, serviceName, `-e "CREATE DATABASE ${to.val('dbName')}";`);

    console.log(`Importing into database '${toDbUrl}' ...`);
    this.mysql(toEndpointName, serviceName, `${to.val('dbName')} < ${dumpFilename}`);

    console.log('Deleting dumped file ...');
    this.unlink(dumpFilename);

    return Promise.resolve({});
  }

  previewString(fromEndpointName, toEndpointName, serviceName) {
    const fromDbUrl = this.databaseUrl(fromEndpointName, serviceName);
    const toDbUrl = this.databaseUrl(toEndpointName, serviceName);
    return `Replace the database '${toDbUrl}' with data from '${fromDbUrl}'`;
  }
}
module.exports = MysqlSyncProvider;
