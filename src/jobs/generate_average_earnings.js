const { fetchAverageHotspotEarnings } = require('../helpers/rewards')
const { setCache } = require('../helpers/cache')

const generateAverageEarnings = async () => {
  const day = await fetchAverageHotspotEarnings()
  const week = await fetchAverageHotspotEarnings(7)
  const month = await fetchAverageHotspotEarnings(30)

  const averages = { day, week, month }

  await setCache('avg_hotspot_earnings', JSON.stringify(averages), {
    expires: false,
  })
}

const run = async () => {
  await generateAverageEarnings()
  return process.exit(0)
}

run()
