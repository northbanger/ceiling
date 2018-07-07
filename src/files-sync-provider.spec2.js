const FilesSyncProvider = require('./files-sync-provider');
const cliConfig = require('./config');
const consoleMock = require('console-mock2');

describe('getUploadsUrl', () => {

  it('empty', () => {
    const config = cliConfig.clone().object({
      sync: {
        server: {
          files: {
            path: 'uploads'
          }
        }
      }
    });
    var filesSyncProvider = new FilesSyncProvider(config, true);
    expect(() => filesSyncProvider.getUploadsUrl('live', 'server')).toThrow(new MissingVariableError('endpoints.live.server.sshHost'));
  });

  it('missing path', () => {
    const config = cliConfig.clone().object({
      sync: {
        server: {
          files: true
        }
      }
    });
    var filesSyncProvider = new FilesSyncProvider(config, true);
    expect(() => filesSyncProvider.getUploadsUrl('live', 'server')).toThrow(new MissingVariableError('sync.server.files.path'));
  });

  it('local', () => {
    const config = cliConfig.clone().object({
      sync: {
        server: {
          files: {
            path: 'uploads'
          }
        }
      }
    });
    var filesSyncProvider = new FilesSyncProvider(config, true);
    expect(filesSyncProvider.getUploadsUrl('local', 'server')).toEqual('uploads');
  });

  it('live without sshPath', () => {
    const config = cliConfig.clone().object({
      sync: {
        server: {
          files: {
            path: 'uploads'
          }
        }
      },
      endpoints: {
        live: {
          server: {
            sshHost: 'foo.de'
          }
        }
      }
    });
    var filesSyncProvider = new FilesSyncProvider(config, true);
    expect(filesSyncProvider.getUploadsUrl('live', 'server')).toEqual('root@foo.de:uploads');
  });

  it('live with sshPath', () => {
    const config = cliConfig.clone().object({
      sync: {
        server: {
          files: {
            path: 'uploads'
          }
        }
      },
      endpoints: {
        live: {
          server: {
            sshHost: 'foo.de',
            sshPath: '/home'
          }
        }
      }
    });
    var filesSyncProvider = new FilesSyncProvider(config, true);
    expect(filesSyncProvider.getUploadsUrl('live', 'server')).toEqual('root@foo.de:/home/uploads');
  });

});

describe('execute', () => {

  it('works', done => {
    const config = cliConfig.clone().object({
      sync: {
        server: {
          files: {
            path: 'uploads'
          }
        }
      },
      endpoints: {
        live: {
          server: {
            sshHost: 'foo.de'
          }
        }
      }
    });
    var filesSyncProvider = new FilesSyncProvider(config, true);
    consoleMock(() => {
      filesSyncProvider.execute('local', 'live', 'server').then(result => {
        expect(result).toEqual(['rsync -a --delete uploads/ root@foo.de:uploads']);
        done();
      });
    });
  });
});
