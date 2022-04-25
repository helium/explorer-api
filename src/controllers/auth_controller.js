const aes256 = require('aes256')

const BLOCKJOY_SECRET_KEY = process.env.BLOCKJOY_SECRET_KEY
const VALID_HOSTNAMES = ['localhost', 'explorer.helium.com']
const SCORE_THRESHOLD = 0.8

export const getAuth = async (req, res) => {
  if (!req.recaptcha.error) {
    const { hostname, score, action } = req.recaptcha.data

    if (VALID_HOSTNAMES.includes(hostname)) {
      if (action === 'auth') {
        if (score >= SCORE_THRESHOLD) {
          const token = constructToken(req)
          res.status(200).send({ token })
        } else {
          res.status(400).send({ error: 'low-score' })
        }
      } else {
        res.status(400).send({ error: 'invalid-action' })
      }
    } else {
      res.status(400).send({ error: 'invalid-hostname' })
    }
  } else {
    res.status(400).send({ error: req.recaptcha.error })
  }
}

const constructToken = (req) => {
  const now = Date.now()

  const payload = {
    iss: 'explorer-api',
    sub: req.ip,
    iat: now,
  }

  const tokenB64 = aes256.encrypt(BLOCKJOY_SECRET_KEY, JSON.stringify(payload))
  return Buffer.from(tokenB64, 'base64').toString('hex')
}
