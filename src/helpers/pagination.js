const fetch = require('node-fetch')
const qs = require('qs')

const API_BASE_URL = process.env.API_BASE_URL + '/v1'

const url = (path, params, cursor) => {
  let fullURL = API_BASE_URL + path
  if (params || cursor) {
    params = qs.stringify({ ...params, cursor })
    fullURL += `?${params}`
  }
  return fullURL
}

const fetchAll = async (
  path,
  params,
  acc = [],
  cursor,
) => {
  const response = await fetch(url(path, params, cursor))
  const { data, cursor: nextCursor } = await response.json()
  const accData = [...acc, ...data]

  if (nextCursor) {
    const nextData = await fetchAll(path, params, accData, nextCursor)
    return nextData
  }

  return accData
}

module.exports = { fetchAll }
