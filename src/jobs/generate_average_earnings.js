const { fetchAverageHotspotEarnings } = require('../helpers/rewards')
const { setCache } = require('../helpers/cache')

const generateAverageEarnings = async () => {
  try {
    const day = await fetchAverageHotspotEarnings()
    const week = await fetchAverageHotspotEarnings(7)

    const averages = { day, week }

    await setCache('avg_hotspot_earnings', JSON.stringify(averages), {
      expires: false,
    })
  } catch (e) {
    console.error(e)
  }
}

const run = async () => {
  await generateAverageEarnings()
  return process.exit(0)
}

run()
