import commands from './commands'
import { mapValues, values } from '@dword-design/functions'

export default commands |> mapValues('action') |> values
