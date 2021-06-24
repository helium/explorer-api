const { Client } = require('@helium/http')
const { redisClient } = require('../helpers/redis')
const { Sample } = require('redis-time-series-ts')
const { fetchAll } = require('../helpers/pagination')

const generateStats = async () => {
  const client = new Client()
  const validators = await fetchAll('/validators')
  const stats = await client.stats.get()
  const now = new Date()

  const stakedPct = (validators.length * 10000) / stats.tokenSupply

  await redisClient.add(
    new Sample('validators_count', validators.length, now),
    [],
    0,
  )

  await redisClient.add(
    new Sample('validators_staked_pct', stakedPct, now),
    [],
    0,
  )
}

const run = async () => {
  await generateStats()
  return process.exit(0)
}

run()
