import resolveDep from 'resolve-dep'
import { first } from '@dword-design/functions'
import getPackageName from 'get-package-name'

export default shortName => [
  `@dword-design/ceiling-plugin-${shortName}`,
  `ceiling-plugin-${shortName}`,
  shortName,
]
  |> resolveDep
  |> first
  |> getPackageName
