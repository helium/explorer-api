const { default: Client, Network } = require('@helium/http')

const TAKE_MAX = 100000

const client = new Client(
  new Network({ baseURL: 'https://helium-api.stakejoy.com', version: 1 }),
  { retry: 3 },
)

module.exports = { client, TAKE_MAX }
