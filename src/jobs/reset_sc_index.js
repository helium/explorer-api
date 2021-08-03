const { default: Client } = require('@helium/http')
const { formatISO, sub } = require('date-fns')
const fetch = require('node-fetch')
const { setCache } = require('../helpers/cache')

const client = new Client()

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

// if no cache entry exists, then we'll walk back 1000 blocks to backfill it
const backfillScIndex = async () => {
  console.log('backfill sc index')
  const heightLimit = await fetchHeightLimit({ days: 30 })

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

  console.log('scIndex', scIndex)

  await setCache('scIndex', JSON.stringify(scIndex), { expires: false })
}

const run = async () => {
  await backfillScIndex()
  return process.exit(0)
}

run()
