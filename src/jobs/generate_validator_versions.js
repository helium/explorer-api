const { setCache } = require('../helpers/cache')
const countBy = require('lodash/countBy')

const { client } = require('../helpers/client')

const versionCounts = (validators) => {
  const eligibleValidators = validators.filter(
    (v) => v.stakeStatus === 'staked' && v?.status?.online === 'online',
  )
  return countBy(eligibleValidators, 'versionHeartbeat')
}

const run = async () => {
  const validators = await (await client.validators.list()).take(10000)
  const counts = versionCounts(validators)
  await setCache('validatorVersions', JSON.stringify(counts), {
    expires: false,
  })
  return process.exit(0)
}

run()
