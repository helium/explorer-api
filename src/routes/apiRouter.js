import express from 'express'
import { errorResponse, successResponse } from '../helpers'
import { redisClient, timestampRange, aggregation } from '../helpers/redis'

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

router.get('/metrics/hotspots', hotspots)

module.exports = router
