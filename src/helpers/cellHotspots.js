const qs = require('qs')
const fetch = require('node-fetch')

const baseUrl = process.env.CELL_HOTSPOT_BASE_URL
const apiKey = process.env.CELL_HOTSPOT_API_TOKEN

const makeRequest = async (route, params) => {
  const urlRoute = [baseUrl, route].join('/')
  let url = urlRoute
  if (params) {
    url = [urlRoute, qs.stringify(params)].join('?')
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw { status: response.status, message: response.statusText }
  }

  const text = await response.text()
  try {
    const json = JSON.parse(text)
    return json.data || json
  } catch (err) {
    return text
  }
}

export const getLastHeartbeat = async (gatewayAddress) =>
  await makeRequest(`heartbeats/hotspots/${gatewayAddress}/last`)


module.exports = { getLastHeartbeat }
