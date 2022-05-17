const { round } = require('lodash')
const { Sample } = require('redis-time-series-ts')
const { redisClient } = require('../helpers/redis')
const { client } = require('../helpers/client')
const { Client: PgClient } = require('pg')

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

  try {
    const pgClient = new PgClient({
      connectionString: process.env.ETL_DB_URL,
    })
    await pgClient.connect()

    const d = new Date()
    d.setUTCHours(0)
    d.setUTCMilliseconds(0)
    d.setUTCSeconds(0)
    d.setUTCMinutes(0)
    const time = d.getTime() / 1000

    const hotspotsRewardedQuery = `SELECT COUNT(*) FROM (SELECT DISTINCT gateway FROM public.rewards where time >= ${time}) AS temporary;`
    const hotspotsRewarded = await pgClient.query(hotspotsRewardedQuery)
    if (hotspotsRewarded.rows.length && hotspotsRewarded.rows[0].count) {
      await redisClient.add(
        new Sample('hotspots_rewarded', hotspotsRewarded.rows[0].count, now),
        [],
        0,
      )
    }

    const dataTransferredQuery = `SELECT COUNT(*) FROM (SELECT DISTINCT gateway FROM public.packets where time >= ${time}) AS temporary;`
    const dataTransferred = await pgClient.query(dataTransferredQuery)
    if (dataTransferred.rows.length && dataTransferred.rows[0].count) {
      await redisClient.add(
        new Sample(
          'hotspots_data_transferred',
          dataTransferred.rows[0].count,
          now,
        ),
        [],
        0,
      )
    }
  } catch (err) {
    console.log(err.stack)
  }
}

const run = async () => {
  await generateStats()
  await redisClient.disconnect()
  return process.exit(0)
}

run()
