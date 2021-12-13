const { getUnixTime } = require('date-fns')
const { last } = require('lodash')
const { getCache } = require('./cache')
const { client, TAKE_MAX } = require('./client')

const NETWORK_DATES = [
  getUnixTime(new Date('2019-08-01')),
  getUnixTime(new Date('2021-08-01')),
]

const TARGET_PRODUCTION = {
  [NETWORK_DATES[0]]: 5000000,
  [NETWORK_DATES[1]]: 5000000 / 2,
}

const getTargetProduction = (timestamp) => {
  const unixTimestamp = getUnixTime(new Date(timestamp))
  if (unixTimestamp >= NETWORK_DATES[1]) {
    return TARGET_PRODUCTION[NETWORK_DATES[1]]
  }

  return TARGET_PRODUCTION[NETWORK_DATES[0]]
}

const fetchNetworkRewards = async () => {
  const numBack = 30
  const bucketType = 'day'

  const rewards = await (
    await client.rewards.sum.list({
      minTime: `-${numBack} ${bucketType}`,
      bucket: bucketType,
    })
  ).take(TAKE_MAX)
  const rewardsWithTarget = rewards.map((r) => ({
    ...r,
    target: getTargetProduction(r.timestamp) / 30,
  }))
  return rewardsWithTarget.reverse()
}

const fetchAverageHotspotEarnings = async (numBack = 1) => {
  const { total: totalRewards } = await client.rewards.sum.get(
    `-${numBack} day`,
  )

  const hotspotMetrics = await getCache('hotspots_metrics')

  let onlineMultiplier

  if (hotspotMetrics?.onlinePct?.length > 0) {
    onlineMultiplier = last(hotspotMetrics.onlinePct).value
  } else {
    throw new Error(
      'Cannot calculate average earnings because hotspot online percent value not set',
    )
  }

  const { hotspots: totalHotspots } = await client.stats.counts()

  const hotspotRewardVarNames = [
    'poc_challengers_percent',
    'poc_challengees_percent',
    'poc_witnesses_percent',
    'dc_percent',
  ]

  const hotspotRewardVars = await client.vars.get(hotspotRewardVarNames)

  const hotspotEligibleMultiplier = Object.keys(hotspotRewardVars).reduce(
    (acc, key) => (acc += hotspotRewardVars[key]),
    0,
  )

  const averageEarnings =
    (totalRewards * hotspotEligibleMultiplier) /
    (totalHotspots * onlineMultiplier)

  return averageEarnings
}

module.exports = { fetchNetworkRewards, fetchAverageHotspotEarnings }
