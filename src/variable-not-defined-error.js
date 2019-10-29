export default class extends Error {

  constructor(variableName, syncProviderName, endpoint) {
    super(`Variable '${variableName}' for sync provider '${syncProviderName}' is not defined for endpoint '${endpoint}'.`)
  }
}
