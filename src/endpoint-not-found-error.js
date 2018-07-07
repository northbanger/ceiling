class EndpointNotFoundError extends Error {

  constructor(endpointName) {
    super(`Endpoint '${endpointName}' could not be found.`);
  }
}
module.exports = EndpointNotFoundError;
