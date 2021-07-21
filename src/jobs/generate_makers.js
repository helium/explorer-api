const { setCache } = require('../helpers/cache')
const { getMakersData } = require('../helpers/makers')

const run = async () => {
  const makers = await getMakersData()
  await setCache('makers', JSON.stringify(makers), { expires: false })
  return process.exit(0)
}

run()
