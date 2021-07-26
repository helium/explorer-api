const { default: Client } = require('@helium/http')
const { groupBy, compact, mean, round, flatten, sum } = require('lodash')
const { setCache, getCache } = require('../helpers/cache')
const { fetchAll } = require('../helpers/pagination')

const client = new Client()

const fetchDcByHotspot = async () => {
  const dcByHotspot = {}

  const scIndex = await getCache('scIndex')
  const txnHashes = flatten(Object.values(scIndex))

  for (let i = 0; i < txnHashes.length; i++) {
    const hash = txnHashes[i]

    const txn = await client.transactions.get(hash)

    txn.stateChannel.summaries.forEach(({ client: hotspot, num_dcs: dc }) => {
      if (dcByHotspot[hotspot]) {
        dcByHotspot[hotspot] += dc
      } else {
        dcByHotspot[hotspot] = dc
      }
    })
  }

  return dcByHotspot
}

const run = async () => {
  const hotspots = await fetchAll('/hotspots')
  const hotspotsByHex = groupBy(hotspots, 'location_hex')
  const dcByHotspot = await fetchDcByHotspot()

  // ignore hotspots without location for the purpose of coverage
  delete hotspotsByHex.null

  const hexes = Object.keys(hotspotsByHex).map((hex) => {
    const rewardScales = compact(hotspotsByHex[hex].map((h) => h.reward_scale))
    const dc = sum(hotspotsByHex[hex].map((h) => dcByHotspot[h.address]))

    return {
      hex,
      count: hotspotsByHex[hex].length,
      scale: round(rewardScales.length > 0 ? mean(rewardScales) : 0, 2),
      dc: dc || 0,
    }
  })

  await setCache('hexes', JSON.stringify(hexes), { expires: false })
  return process.exit(0)
}

run()
