const Client = require('@helium/http').default
const fetch = require('node-fetch')
const { client } = require('./client')

const DEPRECATED_HELIUM_MAKER_ADDR =
  '14fzfjFcHpDR1rTH8BNPvSi5dKBbgxaDnmsVPbCjuq9ENjpZbxh'

const DEPRECATED_HELIUM_BURN_ADDR =
  '1398hLeHESZHE5jVtaLAV5fdg2vrUeZEs2B92t7TzeQTtugr8dL'

const MAKER_INTEGRATION_TEST_ADDR =
  '138LbePH4r7hWPuTnK6HXVJ8ATM2QU71iVHzLTup1UbnPDvbxmr'

const deprecatedHeliumMaker = {
  address: DEPRECATED_HELIUM_MAKER_ADDR,
  name: 'Helium Inc (Old)',
  // the number of gen_gateway_v1 txns in block 1
  // https://explorer.helium.com/blocks/1
  // no reason to fetch this since it will never change
  genesisHotspots: 45,
}

const getMakersData = async () => {
  const makersResponse = await fetch(
    `https://onboarding.dewi.org/api/v2/makers`,
  )
  const { data: dewiMakers } = await makersResponse.json()

  // Hide maker integration test address
  const makersToCount = dewiMakers.filter(
    (m) => m.address !== MAKER_INTEGRATION_TEST_ADDR,
  )

  const makers = await Promise.all(makersToCount.map(calculateMakerInfo))
  const heliumMaker = await calculateMakerInfo(deprecatedHeliumMaker)
  const heliumAccount = await calculateMakerInfo({
    address: DEPRECATED_HELIUM_BURN_ADDR,
  })

  heliumMaker.txns.tokenBurnAmountInBones =
    heliumAccount.txns.tokenBurnAmountInBones

  return [...makers, heliumMaker]
}

const calculateMakerInfo = async (maker) => {
  const makerInfo = await client.accounts.get(maker.address)
  maker.balanceInfo = JSON.parse(JSON.stringify(makerInfo))

  const MAX_TXNS = 50000
  let addGatewayTxns, assertLocationTxns

  let makerTxns

  if (maker.address !== DEPRECATED_HELIUM_BURN_ADDR) {
    const txnCountsRes = await fetch(
      `https://api.helium.io/v1/accounts/${maker.address}/activity/count?filter_types=add_gateway_v1,assert_location_v1,assert_location_v2,token_burn_v1`,
    )
    const txnCounts = await txnCountsRes.json()
    assertLocationTxns =
      txnCounts.data['assert_location_v1'] +
      txnCounts.data['assert_location_v2']
    addGatewayTxns = txnCounts.data['add_gateway_v1']

    makerTxns = {
      addGatewayTxns,
      assertLocationTxns,
    }
  }

  const tokenBurnTxnsList = await client.account(maker.address).activity.list({
    filterTypes: ['token_burn_v1'],
  })

  const tokenBurnTxns = await tokenBurnTxnsList.take(MAX_TXNS)

  let tokenBurnAmountInBones = 0
  tokenBurnTxns.map((b) => {
    return (tokenBurnAmountInBones += b.amount.integerBalance)
  })

  makerTxns = {
    ...makerTxns,
    tokenBurnAmountInBones,
  }

  maker.txns = JSON.parse(JSON.stringify(makerTxns))

  return maker
}

module.exports = { getMakersData }
