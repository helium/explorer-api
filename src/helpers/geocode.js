const { getCache } = require('./cache')

const qs = require('qs')
const fetch = require('node-fetch')

const baseUrl = 'https://maps.googleapis.com/maps/api/geocode'
const key = process.env.GOOGLE_MAPS_API_KEY

const makeRequest = async (lat, lng) => {
  const latlng = [lat, lng].join(',')
  const urlRoute = [baseUrl, 'json'].join('/')
  const url = [urlRoute, qs.stringify({ latlng, key })].join('?')

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = new Error(
        `Bad response, status:${response.status} message:${response.statusText}`,
      )
      throw error
    }

    const text = await response.text()
    try {
      const json = JSON.parse(text)
      return json.data || json
    } catch (err) {
      return text
    }
  } catch (error) {
    throw error
  }
}

const reverseGeocode = async (lat, lng) => {
  return getCache(
    `reverseGeocode:lat=${lat}lng=${lng}`,
    async () => makeRequest(lat, lng),
    { expires: false },
  )
}

module.exports = { reverseGeocode }
