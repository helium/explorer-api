const { formatISO, sub } = require('date-fns')
const { max, pickBy, flatten } = require('lodash')
const fetch = require('node-fetch')
const { setCache, getCache } = require('../helpers/cache')
const { client } = require('../helpers/client')

//
// state channel index:
// [height]: ['hash', 'hash']
//

const fetchHeightLimit = async (limit) => {
  const timestamp = formatISO(sub(new Date(), limit))
  const response = await fetch(
    `https://api.helium.io/v1/blocks/height?max_time=${timestamp}`,
  )
  const {
    data: { height },
  } = await response.json()
  return height
}

const fetchScIndex = async (heightLimit) => {
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

  return scIndex
}

// if a cache entry exists, then we'll only walk back from the head to the latest
// entry in the index
const updateScIndex = async () => {
  console.log('update sc index')
  const prevScIndex = await getCache('scIndex')

  const prevHeight = max(Object.keys(prevScIndex))
  const scIndex = await fetchScIndex(prevHeight)

  const heightLimit = await fetchHeightLimit({ days: 7 })

  const limitedPrevScIndex = pickBy(
    prevScIndex,
    (v, height) => parseInt(height) >= heightLimit,
  )

  const newScIndex = { ...limitedPrevScIndex, ...scIndex }

  await setCache('scIndex', JSON.stringify(newScIndex), { expires: false })
}

const setDcByHotspot = async () => {
  console.log('set dc by hotspot')
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
  await updateScIndex()
  await setDcByHotspot()

  return process.exit(0)
}

run()
