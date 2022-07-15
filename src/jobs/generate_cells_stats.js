const fetch = require('node-fetch')
const { Sample } = require('redis-time-series-ts')
const { redisClient } = require('../helpers/redis')

const SAS_API_KEY = process.env.SAS_API_KEY

const fetchMetrics = async () => {
  const response = await fetch(
    'https://spectrum-analytics.federatedwireless.com/v2.0/dashboardCbsdMetrics',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${SAS_API_KEY}`,
      },
    },
  )
  const { metricByOrganization } = await response.json()
  const metrics = metricByOrganization.find(
    ({ orgName }) => orgName === 'Helium Network',
  )

  return metrics
}

const run = async () => {
  const now = new Date()
  const { subTotal, catA, catB } = await fetchMetrics()
  await redisClient.add(
    new Sample('cells_count', subTotal, now),
    [],
    0,
  )
  await redisClient.add(
    new Sample('cells_indoor_count', catA, now),
    [],
    0,
  )
  await redisClient.add(
    new Sample('cells_outdoor_count', catB, now),
    [],
    0,
  )
  return process.exit(0)
}

run()
