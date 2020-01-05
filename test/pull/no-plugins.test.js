import { spawn } from 'child-process-promise'
import withLocalTmpDir from 'with-local-tmp-dir'
import expect from 'expect'

export default () => withLocalTmpDir(__dirname, async () => {
  const { stdout } = await spawn('ceiling', ['pull', '-y'], { capture: ['stdout'] })
  expect(stdout).toEqual('No plugins specified. Doing nothing …\n')
})
