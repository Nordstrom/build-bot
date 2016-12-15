const semver = require('semver')
const mgr = require('./mgr.js')
const git = require('./github.js')
const drone = require('./drone.js')

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
  let started = false
  let i = setInterval(() => {
    console.log('check drone status')
    drone.getStatus(build.repo)
      .then(status => {
        console.log('drone status', status)
        if (status === 'success' && started) {
          console.log('drone success')
          mgr.finish(build)
            .then(() => {
              actions.finish(build)
            })
          clearInterval(i)
        } else if (status === 'running' && !started) {
          console.log('drone running')
          started = true
          mgr.start(build)
            .then(() => {
              actions.start(build)
            })
        } else if (status === 'failure' && started) {
          console.log('drone failure')
          mgr.fail(build)
            .then(() => {
              actions.fail(build)
            })
          clearInterval(i)
        }
      })
  }, 1000)
}

function commit(build) {
  
}

module.exports = {
  detectVersion: detectVersion,
  deploy: deploy,
  monitor: monitor
}
