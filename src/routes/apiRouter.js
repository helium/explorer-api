import express from 'express'
import Client from '@helium/http'
import { errorResponse, successResponse } from '../helpers'
import { getCache } from '../helpers/cache'
import { redisClient, timestampRange, aggregation } from '../helpers/redis'
import { fetchValidators } from '../helpers/validators'

const router = express.Router()

export const hotspots = async (req, res) => {
  try {
    const range = timestampRange()
    const agg = aggregation()
    const count = await redisClient.range(
      'hotspots_count',
      range,
      undefined,
      agg,
    )
    const onlinePct = await redisClient.range(
      'hotspots_online_pct',
      range,
      undefined,
      agg,
    )
    const ownersCount = await redisClient.range(
      'hotspots_owners_count',
      range,
      undefined,
      agg,
    )
    const citiesCount = await redisClient.range(
      'hotspots_cities_count',
      range,
      undefined,
      agg,
    )
    const countriesCount = await redisClient.range(
      'hotspots_countries_count',
      range,
      undefined,
      agg,
    )
    return successResponse(req, res, {
      count,
      onlinePct,
      ownersCount,
      citiesCount,
      countriesCount,
    })
  } catch (error) {
    errorResponse(req, res, error.message, 500, error.errors)
  }
}

export const validatorMetrics = async (req, res) => {
  try {
    const range = timestampRange()
    const agg = aggregation()
    const count = await redisClient.range(
      'validators_count',
      range,
      undefined,
      agg,
    )
    const stakedPct = await redisClient.range(
      'validators_staked_pct',
      range,
      undefined,
      agg,
    )
    const apy = await redisClient.range('validators_apy', range, undefined, agg)
    return successResponse(req, res, {
      count,
      stakedPct,
      apy,
    })
  } catch (error) {
    errorResponse(req, res, error.message, 500, error.errors)
  }
}

export const blocks = async (req, res) => {
  try {
    const range = timestampRange()
    const agg = aggregation()

    const blockCount = await redisClient.range(
      'blocks_count',
      range,
      undefined,
      agg,
    )
    // const longFiData = await redisClient.range('longfi_data', range, undefined, agg)
    const electionTimeDay = await redisClient.range(
      'election_time_day',
      range,
      undefined,
      agg,
    )
    const blockTimeDay = await redisClient.range(
      'block_time_day',
      range,
      undefined,
      agg,
    )
    const blockTimeDayStdDev = await redisClient.range(
      'block_time_day_std_dev',
      range,
      undefined,
      agg,
    )
    const blockTimeWeek = await redisClient.range(
      'block_time_week',
      range,
      undefined,
      agg,
    )
    const blockTimeWeekStdDev = await redisClient.range(
      'block_time_week_std_dev',
      range,
      undefined,
      agg,
    )
    const blockTimeMonth = await redisClient.range(
      'block_time_month',
      range,
      undefined,
      agg,
    )
    const blockTimeMonthStdDev = await redisClient.range(
      'block_time_month_std_dev',
      range,
      undefined,
      agg,
    )

    const txnRate = await redisClient.range('txn_rate', range, undefined, agg)
    const height = await redisClient.range('height', range, undefined, agg)
    return successResponse(req, res, {
      blockCount,
      // longFiData,
      electionTimeDay,
      blockTimeDay,
      blockTimeDayStdDev,
      blockTimeWeek,
      blockTimeWeekStdDev,
      blockTimeMonth,
      blockTimeMonthStdDev,
      txnRate,
      height,
    })
  } catch (error) {
    errorResponse(req, res, error.message, 500, error.errors)
  }
}

const validators = async (req, res) => {
  const validators = await getCache('validators')
  res.status(200).send(validators || [])
}

const hexes = async (req, res) => {
  const hexes = await getCache('hexes')
  res.status(200).send(hexes || [])
}

const validator = async (req, res) => {
  const { address } = req.params
  const validators = await getCache('validators')
  const validator = validators.find((v) => v.address === address)
  res.status(200).send(validator)
}

const accountValidators = async (req, res) => {
  const { address } = req.params
  const validators = await getCache('validators')
  const accountValidators = validators.filter((v) => v.owner === address)
  res.status(200).send(accountValidators)
}

const searchValidators = async (req, res) => {
  const { term } = req.query
  const client = new Client()
  const list = await client.validators.search(term)
  const matchingValidators = await list.take(20)
  const matchingAddresses = new Set()
  matchingValidators.forEach((v) => matchingAddresses.add(v.address))
  const allValidators = await getCache('validators')
  const validators = allValidators.filter((v) =>
    matchingAddresses.has(v.address),
  )
  res.status(200).send(validators)
}

router.get('/metrics/hotspots', hotspots)
router.get('/metrics/blocks', blocks)
router.get('/metrics/validators', validatorMetrics)
router.get('/validators', validators)
router.get('/validators/:address', validator)
router.get('/accounts/:address/validators', accountValidators)
router.get('/validators/search', searchValidators)
router.get('/hexes', hexes)

module.exports = router
