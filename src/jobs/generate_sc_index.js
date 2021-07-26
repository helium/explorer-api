const { default: Client } = require('@helium/http')
const { formatISO, sub } = require('date-fns')
const { groupBy, max, pickBy } = require('lodash')
const fetch = require('node-fetch')
const { setCache, getCache } = require('../helpers/cache')

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

const fetchScIndex = async (blocks) => {
  const scTxns = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    console.log(
      'gettings txns for block',
      block.height,
      blocks.length - i,
      'blocks to go',
    )
    const txns = await (await block.transactions.list()).take(10000)

    scTxns.push(...txns.filter((txn) => txn.type === 'state_channel_close_v1'))
  }

  const scIndex = {}

  scTxns.forEach((txn) => {
    if (scIndex[txn.height]) {
      scIndex[txn.height] = [...scIndex[txn.height], txn.hash]
    } else {
      scIndex[txn.height] = [txn.hash]
    }
  })

  return scIndex
}

// if a cache entry exists, then we'll only walk back from the head to the latest
// entry in the index
const updateScIndex = async (prevScIndex) => {
  console.log('update sc index')

  const prevHeight = max(Object.keys(prevScIndex))
  const currentHeight = await client.blocks.getHeight()
  const blocksToTake = currentHeight - prevHeight

  console.log(
    'prev height',
    prevHeight,
    'current height',
    currentHeight,
    'blocks to take',
    blocksToTake,
  )

  const blocks = await (await client.blocks.list()).take(blocksToTake)
  const scIndex = await fetchScIndex(blocks)

  const heightLimit = await fetchHeightLimit({ days: 30 })
  console.log('height limit', heightLimit)

  const limitedPrevScIndex = pickBy(
    prevScIndex,
    (v, height) => parseInt(height) >= heightLimit,
  )

  await setCache(
    'scIndex',
    JSON.stringify({ ...limitedPrevScIndex, ...scIndex }),
    { expires: false },
  )
}

// if no cache entry exists, then we'll walk back 1000 blocks to backfill it
const backfillScIndex = async () => {
  console.log('backfill sc index')

  const blocks = await (await client.blocks.list()).take(1000)
  const scIndex = await fetchScIndex(blocks)

  await setCache('scIndex', JSON.stringify(scIndex), { expires: false })
}

const run = async () => {
  const scIndex = await getCache('scIndex')

  if (scIndex) {
    await updateScIndex(scIndex)
  } else {
    await backfillScIndex()
  }

  return process.exit(0)
}

run()
