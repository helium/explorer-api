const { groupBy, compact, mean, round, sum } = require('lodash')
const { setCache, getCache } = require('../helpers/cache')
const { fetchAll } = require('../helpers/pagination')

const run = async () => {
  const hotspots = await fetchAll('/hotspots')
  const hotspotsByHex = groupBy(hotspots, 'location_hex')
  const dcByHotspot = await getCache('dcByHotspot')

  // ignore hotspots without location for the purpose of coverage
  delete hotspotsByHex.null

  const hexes = Object.keys(hotspotsByHex).map((hex) => {
    const rewardScales = compact(hotspotsByHex[hex].map((h) => h.reward_scale))
    const dc = sum(hotspotsByHex[hex].map((h) => dcByHotspot[h.address]))

    return {
      hex,
      count: hotspotsByHex[hex].length,
      scale: round(rewardScales.length > 0 ? mean(rewardScales) : 0, 2),
      dc,
    }
  })

  await setCache('hexes', JSON.stringify(hexes), { expires: false })
  return process.exit(0)
}

run()
