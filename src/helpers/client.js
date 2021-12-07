const { default: Client, Network } = require('@helium/http')

const TAKE_MAX = 1000000
const API_BASE_URL = process.env.API_BASE_URL

const client = new Client(new Network({ baseURL: API_BASE_URL, version: 1 }), {
  retry: 3,
})

module.exports = { client, TAKE_MAX, API_BASE_URL }
