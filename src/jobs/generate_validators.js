const { setCache } = require('../helpers/cache')
const { fetchValidators } = require('../helpers/validators')
const countBy = require('lodash/countBy')

const versionCounts = (validators) => {
  const eligibleValidators = validators.filter(
    (v) => v.stakeStatus === 'staked' && v?.status?.online === 'online',
  )
  return countBy(eligibleValidators, 'versionHeartbeat')
}

const run = async () => {
  const validators = await fetchValidators()
  const counts = versionCounts(validators)
  await setCache('validatorVersions', JSON.stringify(counts), {
    expires: false,
  })
  await setCache('validators', JSON.stringify(validators), { expires: false })
  return process.exit(0)
}

run()
