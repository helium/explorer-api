const { round } = require('lodash')
const { Sample } = require('redis-time-series-ts')
const { redisClient } = require('../helpers/redis')
const { client } = require('../helpers/client')

const generateStats = async () => {
  const {
    hotspots,
    hotspotsOnline,
    cities,
    countries,
    hotspotsDataonly,
  } = await client.stats.counts()

  const onlinePct = round(hotspotsOnline / hotspots, 4)

  const now = new Date()

  await redisClient.add(new Sample('hotspots_count', hotspots, now), [], 0)
  await redisClient.add(
    new Sample('hotspots_online_count', hotspotsOnline, now),
    [],
    0,
  )
  await redisClient.add(
    new Sample('hotspots_data_only_count', hotspotsDataonly, now),
    [],
    0,
  )

  await redisClient.add(
    new Sample('hotspots_online_pct', onlinePct, now),
    [],
    0,
  )
  await redisClient.add(new Sample('hotspots_cities_count', cities, now), [], 0)
  await redisClient.add(
    new Sample('hotspots_countries_count', countries, now),
    [],
    0,
  )
}

const run = async () => {
  await generateStats()
  await redisClient.disconnect()
  return process.exit(0)
}

run()
