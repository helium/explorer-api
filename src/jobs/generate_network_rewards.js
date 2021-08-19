const { setCache } = require('../helpers/cache')
const { fetchNetworkRewards } = require('../helpers/rewards')

const run = async () => {
  const rewards = await fetchNetworkRewards()
  await setCache('networkRewards', JSON.stringify(rewards), { expires: false })

  return process.exit(0)
}

run()
