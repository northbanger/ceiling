import self from './get-plugin-name'
import { mapValues } from '@dword-design/functions'

const runTest = (pluginName, shortName) => () => expect(self(shortName)).toEqual(pluginName)

export default {
  'ceiling-plugin-foo': 'ceiling-plugin-foo',
  'foo': 'ceiling-plugin-foo',
  '@dword-design/ceiling-plugin-foo': '@dword-design/ceiling-plugin-foo',
  '@dword-design/foo': '@dword-design/ceiling-plugin-foo',
}
  |> mapValues(runTest)
