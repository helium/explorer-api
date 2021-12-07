const { setCache } = require('../helpers/cache')
const { fetchAverageHotspotEarnings } = require('../helpers/rewards')

const generateAverageEarnings = async () => {
  const day = await fetchAverageHotspotEarnings()
  const week = await fetchAverageHotspotEarnings(7)
  const month = await fetchAverageHotspotEarnings(30)

  const averages = { day, week, month }

  await redisClient.add(
    new Sample('hotspots_avg_earnings', averages, now),
    [],
    0,
  )
}

const run = async () => {
  await generateAverageEarnings()
  return process.exit(0)
}

run()
