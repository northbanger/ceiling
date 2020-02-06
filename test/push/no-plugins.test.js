import { spawn } from 'child-process-promise'
import withLocalTmpDir from 'with-local-tmp-dir'

export default () => withLocalTmpDir(__dirname, async () => {
  const { stdout } = await spawn('ceiling', ['push', '-y'], { capture: ['stdout'] })
  expect(stdout).toEqual('No plugins specified. Doing nothing …\n')
})
