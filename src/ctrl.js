const semver = require('semver')
const mgr = require('./mgr.js')
const git = require('./github.js')

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
      return git.request(build.repo, build.branch, build.version)
    })
}

function monitor (build, actions) {
  let x = 0
  let i = setInterval(() => {
    x++
    if (x > 5) {
      mgr.finish(build)
        .then(() => {
          actions.finish()
        })
      clearInterval(i)
    } else if (x > 2) {
      mgr.start(build)
        .then(() => {
          actions.start()
        })
    }
  }, 1000)
}

module.exports = {
  detectVersion: detectVersion,
  deploy: deploy,
  monitor: monitor
}
