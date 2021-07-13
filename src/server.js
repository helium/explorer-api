#!/usr/bin/env node

/**
 * Module dependencies.
 */
import app from './app'
var debug = require('debug')('explorer-api:server')
var http = require('http')
const cluster = require('cluster')
const numCPUs = require('os').cpus().length

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3001')
app.set('port', port)

function normalizePort(val) {
  var port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address()
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
  debug('Listening on ' + bind)
}

/**
 * Create HTTP server.
 */


const dev = process.env.NODE_ENV !== 'production'

// Multi-process to utilize all CPU cores.
if (!dev && cluster.isMaster) {
  console.log(`Node cluster master ${process.pid} is running`)

  // Fork workers.
  for (let i = 0; i < numCPUs; i += 1) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(
      `Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`,
    )
  })
} else {
  console.log('server instance running')
  var server = http.createServer(app)

  /**
   * Listen on provided port, on all network interfaces.
   */

  server.listen(port)
  server.on('error', onError)
  server.on('listening', onListening)
}

/**
 * Normalize a port into a number, string, or false.
 */
