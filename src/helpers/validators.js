const fetch = require('node-fetch')
const { fetchAll } = require('./pagination')
const { getCache } = require('./cache')
const camelcaseKeys = require('camelcase-keys')
const { API_BASE_URL } = require('./client')

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

const fetchGeo = (ipAddress) => async () => {
  const response = await fetch(
    `https://tools.keycdn.com/geo.json?host=${ipAddress}`,
    {
      headers: { 'User-Agent': 'keycdn-tools:https://explorer.helium.com' },
    },
  )
  const {
    data: { geo },
  } = await response.json()
  return geo
}

const getGeo = async (listenAddrs) => {
  if (listenAddrs && listenAddrs.length > 0) {
    const match = listenAddrs[0].match(/\ip4\/(.*)\/tcp\/2154/)
    if (match) {
      const ipAddress = match[1]
      return getCache(`geo:${ipAddress}`, fetchGeo(ipAddress), {
        expires: false,
      })
    }
  }
}

const fetchRewards = async (address) => {
  const response = await fetch(
    `${API_BASE_URL}/v1/validators/${address}/rewards/sum/?min_time=-30%20day`,
  )
  const { data } = await response.json()
  return data
}

const fetchValidators = async () => {
  const validators = await fetchAll('/validators')
  const elected = await fetchAll('/validators/elected')
  const electedAddresses = elected.map((e) => e.address)
  const validatorsWithGeo = []

  await asyncForEach(validators, async (v, i) => {
    const geo = await getGeo(v?.status?.listen_addrs)
    const rewards = await fetchRewards(v.address)
    validatorsWithGeo.push({
      ...v,
      geo: geo || {},
      elected: electedAddresses.includes(v.address),
      number: validators.length - i,
      rewards: {
        month: rewards,
      },
    })
  })

  return camelcaseKeys(validatorsWithGeo)
}

module.exports = { fetchValidators, getGeo }
