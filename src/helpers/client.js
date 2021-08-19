const { default: Client, Network } = require('@helium/http')

const TAKE_MAX = 100000

const client = new Client(Network.production, { retry: 0 })

module.exports = { client, TAKE_MAX }
