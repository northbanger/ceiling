import { spawn } from 'child_process'
import VariableNotDefinedError from './variable-not-defined-error'

const getUploadsUrl = config => config.endpointName == 'local'
  ? config.path
  : `${config.user}@${config.host}${config.path ? ':' + config.path : ''}`

export default {

  validate: (config, syncProviderName, endpointName) => {
    if (config.path === undefined) {
      throw new VariableNotDefinedError('path', syncProviderName, endpointName)
    }
  },

  sync: async (fromConfig, toConfig) => {
    const fromUploadsUrl = getUploadsUrl(fromConfig)
    const toUploadsUrl = getUploadsUrl(toConfig)
    console.log(`Syncing uploads ${fromUploadsUrl} > ${toUploadsUrl} ...`)
    await spawn('rsync', ['-a', '--delete', `${fromUploadsUrl}/`, toUploadsUrl], { stdio: 'inherit' })
  },

  previewString: (fromConfig, toConfig) => `Replace data from '${getUploadsUrl(toConfig)}' with data from '${getUploadsUrl(fromConfig)}'`,
}
