function getUploadsUrl(config) {
  return endpointName == 'local'
    ? config.path
    : `${config.user}@${config.host}${path ? ':' + path : ''}`;
}

module.exports = {

  validate(config, syncProviderName, endpointName) {
    if (config.path == null) {
      throw new VariableMissingError('path', syncProviderName, endpointName)
    }
  },

  sync(fromConfig, toConfig) {
    var fromUploadsUrl = getUploadsUrl(fromConfig)
    var toUploadsUrl = getUploadsUrl(toConfig)
    console.log(`Syncing uploads ${fromUploadsUrl} > ${toUploadsUrl} ...`);
    this.exec(`rsync -a --delete ${fromUploadsUrl}/ ${toUploadsUrl}`);
  },

  previewString(fromConfig, toConfig) {
    return `Replace data from '${getUploadsUrl(toConfig)}' with data from '${getUploadsUrl(fromConfig)}'`;
  }
}
