const qs = require('qs')
const fetch = require('node-fetch')

const baseUrl = 'https://maps.googleapis.com/maps/api/place'
const apiKey = process.env.GOOGLE_MAPS_API_KEY

const makeRequest = async (route, params = {}) => {
  const urlRoute = [baseUrl, route, 'json'].join('/')
  const url = [urlRoute, qs.stringify({ ...params, key: apiKey })].join('?')

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

export const getPlaceGeometry = async (placeId) => {
  const response = await makeRequest('details', { placeid: placeId })
  return response.result.geometry
}

const fetchCityPredictions = async (searchTerm) => {
  const response = await makeRequest('autocomplete', {
    input: searchTerm,
    type: '(cities)',
  })
  if (!!response?.predictions) {
    return response.predictions
  }
  return []
}

const fetchCitySearchGeometry = async (searchTerm) => {
  const predictions = await fetchCityPredictions(searchTerm)
  if (predictions.length === 0) return {}
  const geometry = await getPlaceGeometry(predictions[0].place_id)
  return geometry
}

module.exports = { fetchCitySearchGeometry }
