const semver = require('semver')
const mgr = require('./mgr.js')

function detectVersion (build) {
  return mgr.getDeployedVersion(build)
    .then(vsn => {
      console.log('vsn', vsn, 'build', build)
      return semver.inc(vsn, build.release || 'minor') || '1.0.0'
    })
}

function deploy (build) {
  return mgr.request(build)
    .then(() => {
      // git request
    })
}

function monitor (build, actions) {
  let x = 0
  let i = setInterval(() => {
    x++
    if (x > 2) {
      mgr.start(build)
        .then(() => {
          actions.start()
        })
    } else if (x > 5) {
      mgr.finish(build)
        .then(() => {
          actions.finish()
        })
      clearInterval(i)
    }
  }, 1000)
}

module.exports = {
  detectVersion: detectVersion,
  deploy: deploy,
  monitor: monitor
}
