const { Client } = require('@helium/http')
const { setCache } = require('../helpers/cache')
const { redisClient } = require('../helpers/redis')
const { fetchValidators } = require('../helpers/validators')
const { Sample } = require('redis-time-series-ts')

const generateStats = async (validators) => {
  const client = new Client()
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
  const validators = await fetchValidators()
  await generateStats(validators)
  await setCache('validators', JSON.stringify(validators), { expires: false })
  return process.exit(0)
}

run()
