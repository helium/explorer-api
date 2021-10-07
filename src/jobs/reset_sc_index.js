const { formatISO, sub } = require('date-fns')
const { flatten } = require('lodash')
const fetch = require('node-fetch')
const { setCache, getCache } = require('../helpers/cache')
const { client, STAKEJOY_API_BASE_URL } = require('../helpers/client')

//
// state channel index:
// [height]: ['hash', 'hash']
//

// const median = (arr) => {
//   const mid = Math.floor(arr.length / 2),
//     nums = [...arr].sort((a, b) => a - b)
//   return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2
// }

const fetchHeightLimit = async (limit) => {
  const timestamp = formatISO(sub(new Date(), limit))
  const response = await fetch(
    `${STAKEJOY_API_BASE_URL}/v1/blocks/height?max_time=${timestamp}`,
  )
  const {
    data: { height },
  } = await response.json()
  return height
}

const backfillScIndex = async () => {
  console.log('backfill sc index')
  const heightLimit = await fetchHeightLimit({ days: 7 })

  const scIndex = {}

  for await (const txn of await client.stateChannels.list()) {
    if (txn.height < heightLimit) {
      break
    }

    if (scIndex[txn.height]) {
      scIndex[txn.height] = [...scIndex[txn.height], txn.hash]
    } else {
      scIndex[txn.height] = [txn.hash]
    }
  }

  await setCache('scIndex', JSON.stringify(scIndex), { expires: false })
}

const setDcByHotspot = async () => {
  const dcByHotspot = {}

  const scIndex = await getCache('scIndex')
  const txnHashes = flatten(Object.values(scIndex))
  console.log('txn hashes', txnHashes.length)

  for (let i = 0; i < txnHashes.length; i++) {
    const hash = txnHashes[i]
    console.log('hash', hash, i)

    const txn = await client.transactions.get(hash)

    txn.stateChannel.summaries.forEach(({ client: hotspot, numDcs: dc }) => {
      if (dcByHotspot[hotspot]) {
        dcByHotspot[hotspot] += dc
      } else {
        dcByHotspot[hotspot] = dc
      }
    })
  }
  console.log(dcByHotspot)

  await setCache('dcByHotspot', JSON.stringify(dcByHotspot), { expires: false })
}

const run = async () => {
  await backfillScIndex()
  await setDcByHotspot()
  return process.exit(0)
}

run()
