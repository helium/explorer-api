import express from 'express'
import Client from '@helium/http'
const Recaptcha = require('express-recaptcha').RecaptchaV3
import { errorResponse, successResponse } from '../helpers'
import { getCache, setCache, getHexCache, setHexCache } from '../helpers/cache'
import { redisClient, timestampRange, aggregation } from '../helpers/redis'
import { fetchCitySearchGeometry } from '../helpers/cities'
import { getGeo } from '../helpers/validators'
import { getAuth } from '../controllers/auth_controller'
import { getCellHotspot } from '../helpers/cellHotspots'
import {
    getCellAvgSpeedtest,
    getCellLatestSpeedtest,
    getCellRewards,
    getHotspotCellRewards,
    getHotspotCells
} from '../helpers/mobileApi'
import camelcaseKeys from 'camelcase-keys'

const router = express.Router()

const recaptcha = new Recaptcha(
  process.env.RECAPTCHA_SITE_KEY,
  process.env.RECAPTCHA_SECRET_KEY,
)

export const hotspots = async (req, res) => {
  try {
    const metrics = await getCache(
      'hotspots_metrics',
      async () => {
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
        const dataOnlyCount = await redisClient.range(
          'hotspots_data_only_count',
          range,
          undefined,
          agg,
        )
        const onlineCount = await redisClient.range(
          'hotspots_online_count',
          range,
          undefined,
          agg,
        )
        const rewardedCount = await redisClient.range(
          'hotspots_rewarded',
          range,
          undefined,
          agg,
        )
        const dataTransferredCount = await redisClient.range(
          'hotspots_data_transferred',
          range,
          undefined,
          agg,
        )
        const witnessesCount = await redisClient.range(
          'hotspot_witnesses',
          range,
          undefined,
          agg,
        )
        const challengeesCount = await redisClient.range(
          'hotspot_challengees',
          range,
          undefined,
          agg,
        )
        const challengeesWeekCount = await redisClient.range(
          'hotspot_challengees_week',
          range,
          undefined,
          agg,
        )
        return {
          count,
          onlinePct,
          ownersCount,
          citiesCount,
          countriesCount,
          dataOnlyCount,
          onlineCount,
          rewardedCount,
          dataTransferredCount,
          witnessesCount,
          challengeesCount,
          challengeesWeekCount,
        }
      },
      { expires: true, ttl: 60 },
    )
    return successResponse(req, res, metrics)
  } catch (error) {
    errorResponse(req, res, error.message, 500, error.errors)
  }
}

export const validatorMetrics = async (req, res) => {
  try {
    const metrics = await getCache(
      'validators_metrics',
      async () => {
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
        const apy = await redisClient.range(
          'validators_apy',
          range,
          undefined,
          agg,
        )
        return {
          count,
          stakedPct,
          apy,
        }
      },
      { expires: true, ttl: 60 },
    )
    return successResponse(req, res, metrics)
  } catch (error) {
    errorResponse(req, res, error.message, 500, error.errors)
  }
}

export const blocks = async (req, res) => {
  try {
    const metrics = await getCache(
      'blocks_metrics',
      async () => {
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

        const txnRate = await redisClient.range(
          'txn_rate',
          range,
          undefined,
          agg,
        )
        const height = await redisClient.range('height', range, undefined, agg)

        return {
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
        }
      },
      { expires: true, ttl: 60 },
    )
    return successResponse(req, res, metrics)
  } catch (error) {
    errorResponse(req, res, error.message, 500, error.errors)
  }
}

const validators = async (req, res) => {
  const validators = await getCache('validators')
  res.status(200).send(validators || [])
}

const averageHotspotEarnings = async (req, res) => {
  const averageHotspotEarnings = await getCache('avg_hotspot_earnings')
  res.status(200).send(averageHotspotEarnings || [])
}

const hexes = async (req, res) => {
  let hexes
  hexes = await getHexCache()
  if (!hexes) {
    hexes = await getCache('hexes')
    await setHexCache(hexes)
  }
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

const makers = async (req, res) => {
  const { type } = req.query
  const makers = await getCache('makers')
  // TODO this should be more sophisticated
  if (type === '5g') {
    const makerIds = [19, 67]
    const makers5g = (makers || []).filter(m => makerIds.includes(m.id))
    res.status(200).send(makers5g)
  } else {
    res.status(200).send(makers || [])
  }
}

const searchCities = async (req, res) => {
  const { term } = req.query
  const cities = await fetchCitySearchGeometry(term)
  res.status(200).send(cities)
}

const parseB64 = (str) => {
  const buff = Buffer.from(str, 'base64url')
  return JSON.parse(buff)
}

const geoIp = async (req, res) => {
  const { addrs } = req.params
  const listenAddrs = parseB64(addrs)
  const geo = await getGeo(listenAddrs)
  res.status(200).send(geo)
}

const validatorVersions = async (req, res) => {
  const versions = await getCache('validatorVersions')
  res.status(200).send(versions || {})
}

const networkRewards = async (req, res) => {
  const rewards = await getCache('networkRewards')
  res.status(200).send(rewards || [])
}

const postHexEarnings = async (req, res) => {
  const authKey = req.header('Authorization')
  const tsAuthKey = process.env.TILESERVER_AUTH_KEY

  if (tsAuthKey !== authKey) {
    res.status(401).send()
  } else {
    if (req.body?.updatedAt) {
      await setCache('hexEarnings', JSON.stringify(req.body), {
        expires: false,
      })
    }

    res.status(200).send()
  }
}

const getHexEarnings = async (_req, res) => {
  const hexEarnings = await getCache('hexEarnings')
  res.status(200).send(hexEarnings || '')
}

const getCellHotspotData = async (req, res) => {
  const gatewayAddress = req.params.id
  try {
    const cellHotspot = await getCache(
      `cellHotspot:${gatewayAddress}`,
      async () => getCellHotspot(gatewayAddress),
      { expires: true, ttl: 60 },
    )
    res.status(200).send(camelcaseKeys(cellHotspot) || {})
  } catch (error) {
    if (error && error.status) {
      res.status(error.status).send(error.message)
    } else {
      res.status(500).send()
    }
  }
}

const getCellsForHotspot = async (req, res) => {
  const hotspotPubKey = req.params.id
  try {
    const hotspotCells = await getCache(
      `cellsForHotspot:${hotspotPubKey}`,
      async () => getHotspotCells(hotspotPubKey),
      { expires: true, ttl: 60 },
    )
    const result = hotspotCells && hotspotCells.length
      ? hotspotCells.map((cell) => camelcaseKeys(cell))
      : []
    res.status(200).send(result)
  } catch (error) {
    console.log(error)
    if (error && error.status) {
      res.status(error.status).send(error.message)
    } else {
      res.status(500).send()
    }
  }
}

const getCellLatestSpeedtestData = async (req, res) => {
  const gatewayAddress = req.params.id
  try {
    const cellSpeedtest = await getCache(
      `cellLatestSpeedtest:${gatewayAddress}`,
      async () => getCellLatestSpeedtest(gatewayAddress),
      { expires: true, ttl: 60 },
    )
    res.status(200).send(camelcaseKeys(cellSpeedtest) || {})
  } catch (error) {
    if (error && error.status) {
      res.status(error.status).send(error.message)
    } else {
      res.status(500).send()
    }
  }
}

const getCellAvgSpeedtestData = async (req, res) => {
  const gatewayAddress = req.params.id
  try {
    const avgSpeedtest = await getCache(
      `cellAvgSpeedtest:${gatewayAddress}`,
      async () => getCellAvgSpeedtest(gatewayAddress),
      { expires: true, ttl: 60 },
    )
    res.status(200).send(camelcaseKeys(avgSpeedtest) || {})
  } catch (error) {
    if (error && error.status) {
      res.status(error.status).send(error.message)
    } else {
      res.status(500).send()
    }
  }
}

const getCellHotspotRewardData = async (req, res) => {
    const hotspotAddress = req.params.id
    const maxTime = req.query.max_date
    const minTime = req.query.min_date
    try {
        const rewards = await getCache(
            `cellHotspotRewardData:${hotspotAddress}/${maxTime}/${minTime}`,
            async () => getHotspotCellRewards(hotspotAddress, maxTime, minTime),
            { expires: true, ttl: 300 },
        )
        res.status(200).send(camelcaseKeys(rewards) || {})
    } catch (error) {
        if (error && error.status) {
            res.status(error.status).send(error.message)
        } else {
            res.status(500).send()
        }
    }
}

const getCellRewardData = async (req, res) => {
    const hotspotAddress = req.params.id
    const cbsd = req.params.cbsd
    const maxTime = req.query.max_date
    const minTime = req.query.min_date
    try {
        const rewards = await getCache(
            `cellRewardData:${hotspotAddress}/${cbsd}/${maxTime}/${minTime}`,
            async () => getCellRewards(hotspotAddress, cbsd, maxTime, minTime),
            { expires: true, ttl: 300 },
        )
        res.status(200).send(camelcaseKeys(rewards) || {})
    } catch (error) {
        if (error && error.status) {
            res.status(error.status).send(error.message)
        } else {
            res.status(500).send()
        }
    }
}

export const cellMetrics = async (req, res) => {
  try {
    const metrics = await getCache(
      'cells_metrics',
      async () => {
        const range = timestampRange()
        const agg = aggregation()
        const count = await redisClient.range(
          'cells_count',
          range,
          undefined,
          agg,
        )
        const indoorCount = await redisClient.range(
          'cells_indoor_count',
          range,
          undefined,
          agg,
        )
        const outdoorCount = await redisClient.range(
          'cells_outdoor_count',
          range,
          undefined,
          agg,
        )
        const citiesCount = await redisClient.range(
          'cells_cities_count',
          range,
          undefined,
          agg,
        )
        const statesCount = await redisClient.range(
          'cells_states_count',
          range,
          undefined,
          agg,
        )
        return {
          count,
          indoorCount,
          outdoorCount,
          citiesCount,
          statesCount,
        }
      },
      { expires: true, ttl: 60 },
    )
    return successResponse(req, res, metrics)
  } catch (error) {
    errorResponse(req, res, error.message, 500, error.errors)
  }
}

router.get('/metrics/hotspots', hotspots)
router.get('/metrics/blocks', blocks)
router.get('/metrics/validators', validatorMetrics)
router.get('/metrics/cells', cellMetrics)
router.get('/validators', validators)
router.get('/validators/search', searchValidators)
router.get('/validators/versions', validatorVersions)
router.get('/validators/:address', validator)
router.get('/validators/geo/:addrs', geoIp)
router.get('/accounts/:address/validators', accountValidators)
router.get('/hexes', hexes)
router.get('/makers', makers)
router.get('/cities/search', searchCities)
router.get('/network/rewards', networkRewards)
router.get('/network/rewards/averages', averageHotspotEarnings)
router.post('/hexes/earnings', postHexEarnings)
router.get('/hexes/earnings', getHexEarnings)
router.get('/auth', recaptcha.middleware.verify, getAuth)
router.get('/cell/hotspots/:id', getCellHotspotData)
router.get('/cell/hotspots/:id/cells', getCellsForHotspot)
router.get('/cell/hotspots/:id/latest-speedtest', getCellLatestSpeedtestData)
router.get('/cell/hotspots/:id/avg-speedtest', getCellAvgSpeedtestData)
router.get('/cell/hotspots/:id/rewards', getCellHotspotRewardData)
router.get('/cell/hotspots/:id/cells/:cbsd/rewards', getCellRewardData)

module.exports = router
