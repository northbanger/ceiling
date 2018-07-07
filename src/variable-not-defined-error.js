class VariableNotDefinedError extends Error {

  constructor(variableName, syncProviderName, endpoint) {
    super(`Variable '${variableName}' for sync provider '${syncProviderName}' is not defined for endpoint '${url}'.`);
  }
}
module.exports = CannotConnectError;
