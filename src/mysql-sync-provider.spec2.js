const MysqlSyncProvider = require('./mysql-sync-provider');
const cliConfig = require('./config');
const consoleMock = require('console-mock2');

describe('databaseUrl', () => {

  it('without port', () => {

    const config = cliConfig.clone();
    const mysqlSyncProvider = new MysqlSyncProvider(config, true);
    var result = mysqlSyncProvider.databaseUrl('local', 'database');
    expect(result).toEqual('mysql://database/project');
  });

  it('with port', () => {

    const config = cliConfig.clone().object({
      endpoints: {
        local: {
          database: {
            dbPort: 3307
          }
        },
      }
    });
    const mysqlSyncProvider = new MysqlSyncProvider(config, true);
    var result = mysqlSyncProvider.databaseUrl('local', 'database');
    expect(result).toEqual('mysql://database:3307/project');
  });
});

describe('execute', () => {

  it('replacing urls', done => {
    const config = cliConfig.clone().object({
      sync: {
        database: {
          mysql: {
            replaceUrls: true
          }
        }
      },
      endpoints: {
        local: {
          database: {
            urlHost: 'foo.here'
          }
        },
        live: {
          database: {
            urlHost: 'foo.de'
          }
        }
      }
    });
    const mysqlSyncProvider = new MysqlSyncProvider(config, true);
    consoleMock(() => {
      mysqlSyncProvider.execute('local', 'live', 'database').then(result => {
        expect(result).toEqual([
          'docker exec -i @dword-design/cli_database_1 mysqldump -u "root" -proot project > tempfile',
          'Reading file tempfile',
          'Replacing urls',
          'Writing file tempfile',
          'export MYSQL_PWD="root"; mysql -u "root" --host="database" --port=3306 -e "DROP DATABASE project";',
          'export MYSQL_PWD="root"; mysql -u "root" --host="database" --port=3306 -e "CREATE DATABASE project";',
          'export MYSQL_PWD="root"; mysql -u "root" --host="database" --port=3306 project < tempfile',
          'Unlinking file tempfile'
        ]);
        done();
      });
    });
  });

  it('not replacing urls', done => {
    const config = cliConfig.clone().object({
      sync: {
        database: {
          mysql: true
        }
      },
      endpoints: {
        local: {
          database: {
            urlHost: 'foo.here'
          }
        },
        live: {
          database: {
            urlHost: 'foo.de'
          }
        }
      }
    });
    const mysqlSyncProvider = new MysqlSyncProvider(config, true);
    consoleMock(() => {
      mysqlSyncProvider.execute('local', 'live', 'database').then(result => {
        expect(result).toEqual([
          'docker exec -i @dword-design/cli_database_1 mysqldump -u "root" -proot project > tempfile',
          'Reading file tempfile',
          'Writing file tempfile',
          'export MYSQL_PWD="root"; mysql -u "root" --host="database" --port=3306 -e "DROP DATABASE project";',
          'export MYSQL_PWD="root"; mysql -u "root" --host="database" --port=3306 -e "CREATE DATABASE project";',
          'export MYSQL_PWD="root"; mysql -u "root" --host="database" --port=3306 project < tempfile',
          'Unlinking file tempfile'
        ]);
        done();
      });
    });
  });
});

describe('previewString', () => {

  it('works', () => {

    const config = cliConfig.clone().object({
      endpoints: {
        live: {
          database: {
            dbName: 'livedb',
            dbHost: 'live.de'
          }
        }
      }
    });
    const mysqlSyncProvider = new MysqlSyncProvider(config, true);
    var result = mysqlSyncProvider.previewString('live', 'local', 'database');
    expect(result).toEqual(`Replace the database 'mysql://database/project' with data from 'mysql://live.de/livedb'`);
  });
});
