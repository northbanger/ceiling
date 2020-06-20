import parsePkgName from 'parse-pkg-name'
import { startsWith } from '@dword-design/functions'

export default shortName => {
  const parsedParts = parsePkgName(shortName)
  if (parsedParts.name |> startsWith('ceiling-plugin-')) {
    return shortName
  }
  if (parsedParts.org) {
    return `@${parsedParts.org}/ceiling-plugin-${parsedParts.name}`
  }
  return `ceiling-plugin-${shortName}`
}
