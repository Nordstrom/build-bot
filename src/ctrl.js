const semver = require('semver')
const mgr = require('./mgr.js')
const git = require('./github.js')
const drone = require('./drone.js')
const jira = require('./jira.js')
const convert = require('./util/convertReleaseNotes.js')

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
      console.log('git request', build)
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
      .catch(err => {
        console.log(err)
        clearInterval(i)
      })
  }, 1000)
}

function commit (build, actions) {
  return mgr.getFinished(build)
    .then(bld => {
      // const releaseNotes =
      // '#### My Story\n' +
      // 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec placerat blandit tristique. Nullam eu dui urna. Morbi dictum tempor lectus, in bibendum est aliquam vel. Phasellus dolor dolor, commodo quis tincidunt facilisis, blandit blandit elit. Nam iaculis velit dui, in lobortis augue semper volutpat. Maecenas pharetra elit quis auctor egestas. In hac habitasse platea dictumst. Nunc congue blandit felis nec semper. Curabitur non vehicula augue.\n'
      // // #### Your Story
      // Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec placerat blandit tristique. Nullam eu dui urna. Morbi dictum tempor lectus, in bibendum est aliquam vel. Phasellus dolor dolor, commodo quis tincidunt facilisis, blandit blandit elit. Nam iaculis velit dui, in lobortis augue semper volutpat. Maecenas pharetra elit quis auctor egestas. In hac habitasse platea dictumst. Nunc congue blandit felis nec semper. Curabitur non vehicula augue.
      // '
      return jira.release(bld.branch, bld.version, build.email)
        .then(rtn => {
          console.log('rtn', rtn)
          const releaseNotes = convert(rtn)
          console.log('releaseNotes', releaseNotes)
          return git.commitAndRelease(bld.repo, bld.branch, bld.version, releaseNotes)
        })
        .then(() => {
          return mgr.commit(bld)
        })
        .then(() => {
          actions.committed()
        })
        .catch(err => {
          console.log(err)
          mgr.fail(build)
          actions.failed()
        })
    })
    .catch(err => {
      console.log(err)
      mgr.fail(build)
      actions.failed()
    })
}

module.exports = {
  detectVersion: detectVersion,
  deploy: deploy,
  monitor: monitor,
  commit: commit
}
