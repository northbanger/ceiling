import { mapValues, values } from '@dword-design/functions'

import commands from './commands'

export default commands |> mapValues('action') |> values
