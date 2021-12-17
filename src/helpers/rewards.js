const { getUnixTime } = require('date-fns')
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

module.exports = { fetchNetworkRewards, fetchAverageHotspotEarnings }
