const Promise = require('bluebird')

function lambdize (fn) {
  return (event, context, cb) => {
    fn(event, context).then(res => {
      cb(null, res)
    }).catch(err => {
      cb(err, null)
    })
  }
}

function handshake (req) {
  if (req.token !== '3meDT4zDwZeHCjEWqgA5T8vI') {
    throw 'Invalid Handshake'
  }

  return {
    challenge: req.challenge
  }
}

function process (req) {
  console.log('req', JSON.stringify(req))
  if (req.type === 'url_verification') {
    return handshake(req)
  }
}

function handle (event, context) {
  console.log('event', JSON.stringify(event))
  console.log('context', JSON.stringify(context))
  const reqBody = JSON.parse(event.body)

  return Promise.method(process)(reqBody).then(resBody => {
    return {
      statusCode: 200,
      body: JSON.stringify(resBody)
    }
  }).catch(err => {
    return {
      statusCode: 400,
      body: JSON.stringify(err.message)
    }
  })
}

function message () {}

module.exports = {
  handle: lambdize(handle),
  message
}
