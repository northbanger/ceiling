class NoProvidersError extends Error {

  constructor() {
    super('No providers are configured.')
  }
}

module.exports = NoProvidersError
