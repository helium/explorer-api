const qs = require('qs')
const fetch = require('node-fetch')

const baseUrl = process.env.MOBILE_API_BASE_URL
const user = process.env.MOBILE_API_USER
const apiKey = process.env.MOBILE_API_TOKEN

const makeRequest = async (route, params) => {
  const urlRoute = [baseUrl, route].join('/')
  let url = urlRoute
  if (params) {
    url = [urlRoute, qs.stringify(params)].join('?')
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(user + ":" + apiKey).toString('base64'),
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

export const getCellLatestSpeedtest = async (address) =>
  makeRequest(`latest-speed-tests/${address}`)

export const getHotspotCells = async (address) =>
  makeRequest(`smallcells/hotspot/${address}`)

module.exports = { getCellLatestSpeedtest, getHotspotCells }
