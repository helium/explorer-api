const { default: Client, Network } = require('@helium/http')

const TAKE_MAX = 100000
const STAKEJOY_API_BASE_URL = 'https://helium-api.stakejoy.com'

const client = new Client(
  new Network({ baseURL: STAKEJOY_API_BASE_URL, version: 1 }),
  { retry: 3 },
)

module.exports = { client, TAKE_MAX, STAKEJOY_API_BASE_URL }
