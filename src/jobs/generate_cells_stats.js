const fetch = require('node-fetch')
const { Sample } = require('redis-time-series-ts')
const qs = require('qs')
const { reverseGeocode } = require('../helpers/geocode')
const { redisClient } = require('../helpers/redis')

const SAS_API_KEY = process.env.SAS_API_KEY

const fetchSas = async (path, params = {}) => {
  const urlRoute = `https://spectrum-analytics.federatedwireless.com/v2.0/${path}`
  const url = [urlRoute, qs.stringify(params)].join('?')
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${SAS_API_KEY}`,
    },
  })
  return response.json()
}

const fetchMetrics = async () => {
  const { metricByOrganization } = await fetchSas('dashboardCbsdMetrics')
  const metrics = metricByOrganization.find(
    ({ orgName }) => orgName === 'Helium Network',
  )

  return metrics
}

const fetchCells = async () => {
  const { totalNumCbsds, cbsdList } = await fetchSas('cbsdInformation', {
    organization: 'YUYHM4',
    pageSize: 1000,
    pageNumber: 1,
  })

  if (totalNumCbsds > cbsdList.length) {
    let cells = [...cbsdList]
    const totalPages = Math.ceil(totalNumCbsds / 1000)
    for (let pageNumber = 2; pageNumber <= totalPages; pageNumber++) {
      const response = await fetchSas('cbsdInformation', {
        organization: 'YUYHM4',
        pageSize: 1000,
        pageNumber,
      })
      cells = [...cells, ...response.cbsdList]
    }
    return cells
  } else {
    return cbsdList
  }
}

const geocodeCell = async (cell) => {
  const { results } = await reverseGeocode(
    cell.location.latitude,
    cell.location.longitude,
  )
  return { ...cell, geocode: results[0] }
}

const fetchGeocodedCells = async () => {
  const cells = await fetchCells()
  const geocodedCells = []
  for (const cell of cells) {
    const geocodedCell = await geocodeCell(cell)
    geocodedCells.push(geocodedCell)
  }
  return geocodedCells
}

const countCities = (geocodedCells) => {
  const uniqueCities = new Set()
  for (const cell of geocodedCells) {
    const city = cell?.geocode?.address_components?.find((c) =>
      c.types.includes('locality'),
    )?.short_name
    const state = cell?.geocode?.address_components?.find((c) =>
      c.types.includes('administrative_area_level_1'),
    )?.short_name

    if (city && state) {
      uniqueCities.add([city, state].join(','))
    }
  }
  return uniqueCities.size
}

const run = async () => {
  const now = new Date()

  const { subTotal, catA, catB } = await fetchMetrics()
  const cells = await fetchGeocodedCells()
  const citiesCount = countCities(cells)

  await redisClient.add(new Sample('cells_count', subTotal, now), [], 0)
  await redisClient.add(new Sample('cells_indoor_count', catA, now), [], 0)
  await redisClient.add(new Sample('cells_outdoor_count', catB, now), [], 0)
  await redisClient.add(new Sample('cells_cities_count', citiesCount, now), [], 0)

  return process.exit(0)
}

run()
