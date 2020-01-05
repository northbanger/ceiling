import { spawn } from 'child-process-promise'
import withLocalTmpDir from 'with-local-tmp-dir'
import expect from 'expect'

export default () => withLocalTmpDir(async () => {
  const { stdout } = await spawn('ceiling', ['push', '-y'], { capture: ['stdout'] })
  expect(stdout).toEqual('No sync providers defined. Doing nothing …\n')
})
