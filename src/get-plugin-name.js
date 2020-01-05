import matchdep from 'matchdep'
import { first } from '@dword-design/functions'
import P from 'path'

export default shortName => matchdep.filterAll(
  [
    `@dword-design/ceiling-plugin-${shortName}`,
    `ceiling-plugin-${shortName}`,
    shortName,
  ],
  P.resolve('package.json')
)
  |> first
