const { setCache } = require('../helpers/cache')
const fetch = require('node-fetch')

const generateAverageEarnings = async () => {
  try {
    const walletUrlBase = process.env.WALLET_URL_BASE
    const averages = await (
      await fetch(`${walletUrlBase}/ext/api/hotspots/earnings`)
    ).json()

    await setCache('avg_hotspot_earnings', JSON.stringify(averages), {
      expires: false,
    })
  } catch (e) {
    console.error(e)
  }
}

const run = async () => {
  await generateAverageEarnings()
  return process.exit(0)
}

run()
