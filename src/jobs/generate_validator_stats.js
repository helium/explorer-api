const { redisClient } = require('../helpers/redis')
const { Sample } = require('redis-time-series-ts')
const { fetchAll } = require('../helpers/pagination')
const { clamp, filter } = require('lodash')
const { differenceInDays } = require('date-fns')
const { client } = require('../helpers/client')

const calculateValidatorAPY = (numValidators) => {
  const preHalvingTokensPerDay = 300000 / 30
  const postHalvingTokensPerDay = preHalvingTokensPerDay / 2
  const daysTilHalving = clamp(
    differenceInDays(new Date('2021-08-01'), new Date()),
    0,
    365,
  )
  const daysAfterHalving = 365 - daysTilHalving
  const blendedTokensPerDay =
    preHalvingTokensPerDay * daysTilHalving +
    daysAfterHalving * postHalvingTokensPerDay
  const annualTokensPerValidator = blendedTokensPerDay / numValidators
  const stake = 10000

  return annualTokensPerValidator / stake
}

const generateStats = async () => {
  const validators = await fetchAll('/validators')
  const stats = await client.stats.get()
  const now = new Date()

  const stakedPct = (validators.length * 10000) / stats.tokenSupply
  // TODO change to online validators only
  const apy = calculateValidatorAPY(validators.length)

  await redisClient.add(
    new Sample(
      'validators_count',
      filter(validators, { stake_status: 'staked' }).length,
      now,
    ),
    [],
    0,
  )

  await redisClient.add(
    new Sample('validators_staked_pct', stakedPct, now),
    [],
    0,
  )

  await redisClient.add(new Sample('validators_apy', apy, now), [], 0)
}

const run = async () => {
  await generateStats()
  return process.exit(0)
}

run()
