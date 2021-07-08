const { groupBy, compact, mean, round } = require('lodash')
const { setCache } = require('../helpers/cache')
const { fetchAll } = require('../helpers/pagination')

const run = async () => {
  const hotspots = await fetchAll('/hotspots')
  const hotspotsByHex = groupBy(hotspots, 'location_hex')

  // ignore hotspots without location for the purpose of coverage
  delete hotspotsByHex.null

  const hexes = Object.keys(hotspotsByHex).map((hex) => {
    const rewardScales = compact(hotspotsByHex[hex].map((h) => h.reward_scale))

    return {
      hex,
      count: hotspotsByHex[hex].length,
      scale: round(rewardScales.length > 0 ? mean(rewardScales) : 0, 2),
    }
  })

  await setCache('hexes', JSON.stringify(hexes), { expires: false })
  return process.exit(0)
}

run()
