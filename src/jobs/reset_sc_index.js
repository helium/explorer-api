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

// if no cache entry exists, then we'll walk back 1000 blocks to backfill it
const backfillScIndex = async () => {
  console.log('backfill sc index')
  const currentHeight = await client.blocks.getHeight()
  const heightLimit = await fetchHeightLimit({ days: 30 })
  const blocksToFetch = currentHeight - heightLimit

  const blocks = await (await client.blocks.list()).take(blocksToFetch)
  const scIndex = await fetchScIndex(blocks)
  console.log('scIndex', scIndex)

  await setCache('scIndex', JSON.stringify(scIndex), { expires: false })
}

const run = async () => {
  await backfillScIndex()
  return process.exit(0)
}

run()
