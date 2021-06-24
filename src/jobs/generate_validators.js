const { setCache } = require('../helpers/cache')
const { fetchValidators } = require('../helpers/validators')

const run = async () => {
  const validators = await fetchValidators()
  await setCache('validators', JSON.stringify(validators), { expires: false })
  return process.exit(0)
}

run()
