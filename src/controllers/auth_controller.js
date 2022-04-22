const aes256 = require('aes256')

const BLOCKJOY_SECRET_KEY = process.env.BLOCKJOY_SECRET_KEY

export const getAuth = async (req, res) => {
  const now = Date.now()

  const payload = {
    iss: 'explorer-api',
    sub: req.ip,
    iat: now,
  }

  const tokenB64 = aes256.encrypt(BLOCKJOY_SECRET_KEY, JSON.stringify(payload))
  const token = Buffer.from(tokenB64, 'base64').toString('hex')

  res.status(200).send({ token })
}
