const { setCache } = require('../helpers/cache')
const { fetchAverageHotspotEarnings } = require('../helpers/rewards')

const generateAverageEarnings = async () => {
  const day = await fetchAverageHotspotEarnings()
  const week = await fetchAverageHotspotEarnings(7)
  const month = await fetchAverageHotspotEarnings(30)

  const averages = { day, week, month }

  await setCache('hotspots_avg_earnings', JSON.stringify(averages), {
    expires: false,
  })
}

const run = async () => {
  await generateAverageEarnings()
  return process.exit(0)
}

run()
