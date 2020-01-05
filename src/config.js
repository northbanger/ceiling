import { cosmiconfigSync } from 'cosmiconfig'
import { map, unary, noop, stubArray, identity, zipObject, mapValues, mapKeys } from '@dword-design/functions'
import getPluginName from './get-plugin-name'
import resolveFrom from 'resolve-from'
import babelRegister from '@babel/register'
import babelConfig from '@dword-design/babel-config'

babelRegister(babelConfig)

const explorer = cosmiconfigSync('ceiling')
const searchResult = explorer.search()
const { plugins: shortPluginNames = [], endpoints = {} } = searchResult !== null ? searchResult.config : {}
const pluginNames = shortPluginNames |> map(unary(getPluginName))

export default {
  plugins: zipObject(
    pluginNames,
    pluginNames
      |> map(name => ({
        endpointToString: JSON.stringify,
        getExecutedMigrations: stubArray,
        addExecutedMigrations: noop,
        getMigrationParams: identity,
        sync: noop,
        ...require(resolveFrom(process.cwd(), name)),
      })),
  ),
  endpoints: endpoints
    |> mapValues(mapKeys((pluginConfig, pluginName) => getPluginName(pluginName))),
}
