import commands from './commands'
import { mapValues, values } from '@dword-design/functions'
import getPluginName from './get-plugin-name'

export { getPluginName }

export default commands |> mapValues('action') |> values
