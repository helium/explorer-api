const fetch = require('node-fetch')
const qs = require('qs')

const baseURLs = {
  production: 'https://api.helium.io/v1',
  testnet: 'https://testnet-api.helium.wtf/v1',
  stakejoy: 'https://helium-api.stakejoy.com/v1',
}

const url = (path, params, cursor, network) => {
  let fullURL = baseURLs[network] + path
  if (params || cursor) {
    params = qs.stringify({ ...params, cursor })
    fullURL += `?${params}`
  }
  return fullURL
}

const fetchAll = async (
  path,
  params,
  network = 'stakejoy',
  acc = [],
  cursor,
) => {
  const response = await fetch(url(path, params, cursor, network))
  const { data, cursor: nextCursor } = await response.json()
  const accData = [...acc, ...data]

  if (nextCursor) {
    const nextData = await fetchAll(path, params, network, accData, nextCursor)
    return nextData
  }

  return accData
}

module.exports = { fetchAll }
