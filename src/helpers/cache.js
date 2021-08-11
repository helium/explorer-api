const Redis = require('ioredis')

let redisClient
if (process.env.REDIS_CLOUD_URL) {
  redisClient = new Redis(process.env.REDIS_CLOUD_URL)
}

const getCache = async (key, fallback, opts = {}) => {
  if (redisClient) {
    const cachedValue = await redisClient.get(key)
    if (cachedValue) {
      return JSON.parse(cachedValue)
    }
  }

  if (!fallback) return

  const freshValue = await fallback()

  await setCache(key, JSON.stringify(freshValue), opts)

  return fallback
}

const setCache = async (key, value, opts = {}) => {
  if (!redisClient) return

  const expires = opts.expires === undefined ? true : opts.expires
  const ttl = opts.ttl || 60

  if (expires) {
    await redisClient.set(key, value, 'EX', ttl)
  } else {
    await redisClient.set(key, value)
  }
}

let hexRedisClient
if (process.env.REDIS_URL) {
  hexRedisClient = new Redis(process.env.REDIS_URL)
}

const getHexCache = async () => {
  const key = 'hexes'
  if (hexRedisClient) {
    const cachedValue = await hexRedisClient.get(key)
    if (cachedValue) {
      return JSON.parse(cachedValue)
    }
  }
}

const setHexCache = async (value) => {
  if (!hexRedisClient) return
  const key = 'hexes'
  const ttl = 60 * 5
  await hexRedisClient.set(key, JSON.stringify(value), 'EX', ttl)
}

module.exports = { getCache, setCache, getHexCache, setHexCache }
