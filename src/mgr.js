'use strict'

var _ = require('lodash'),
  State = require('./models/state.js'),
  stateMap = {
    requestable: ['requested', 'started', 'finished'],
    startable: ['requested'],
    finishable: ['started'],
    committable: ['finished'],
    cancelable: ['started', 'requested'],
    failable: ['started', 'finished'],
    committed: ['committed']
  }

function getDeployedVersion (build) {
  return State.getBranchesInStates(stateMap.committed)
        .then(data => {
          if (data && data.items && data.items.length > 0) {
            console.log(JSON.stringify(data.items))
            const item = _.head(_.orderBy(data.items, ['updated'], ['desc']))
            return item.version
          }
        })
}

function requestDeploy (build) {
  return State.getBranchesInStates(stateMap.requestable)
        .then(function (data) {
          if (data && data.items && data.items.length === 0) {
            return State.create({
              repo: build.repo,
              branch: build.branch,
              version: build.version,
              state: 'requested'
            })
          }
          throw new Error('Cannot request a deploy since there is one going on')
        })
}

function startDeploy (build) {
  return State.getBranchesInStates(stateMap.startable)
        .then(function (data) {
          if (data && data.items && data.items.length > 0) {
            if (!_.isEqual(
                        _.pick(build, ['repo', 'branch', 'version']),
                        _.pick(data.items[0], ['repo', 'branch', 'version'])
                    )) {
              throw new Error('build has not been requested for the same branch or version')
            }
            console.log('start item', data.items[0])
            return State.update({
              repo: data.items[0].repo,
              version: data.items[0].version,
              state: 'started'
            })
          }
          throw new Error('There is already requested build. Need to Wait...')
        })
}

function finishDeploy () {
  return State.getBranchesInStates(stateMap.finishable)
        .then(function (data) {
          if (data && data.items && data.items.length > 0) {
            console.log('finish item', data.items[0])
            return State.update({
              repo: data.items[0].repo,
              version: data.items[0].version,
              state: 'finished'
            })
          }
          throw new Error('There is no started build yet')
        })
}
function commitOrRollBack (state) {
  return function () {
    return State.getBranchesInStates(stateMap.committable)
            .then(function (data) {
              if (data && data.items && data.items.length > 0) {
                return State.update({
                  repo: data.items[0].repo,
                  version: data.items[0].version,
                  state: state
                })
              }
              throw new Error('There is no build to be committed/rolled back yet')
            })
  }
}

function failDeploy () {
  return State.getBranchesInStates(stateMap.failable)
        .then(function (data) {
          if (data && data.items && data.items.length > 0) {
            return State.update({
              repo: data.items[0].repo,
              state: 'failed'
            })
          }
          throw new Error('There is no build started or finished')
        })
}

function cancelDeploy () {
  return State.getBranchesInStates(stateMap.cancelable)
        .then(function (data) {
          if (data && data.items && data.items.length > 0) {
            return State.update({
              repo: data.items[0].repo,
              state: 'canceled'
            })
          }
          throw new Error('There is no build started or finished')
        })
}

module.exports = {
  getDeployedVersion: getDeployedVersion,

    // Request a build/deploy - create dynamo record with requested state
  request: requestDeploy,

    // Start a build/deploy - change requested to started state
  start: startDeploy,

    // Finish a build/deploy - change started to finished state
  finish: finishDeploy,

    // Commit a build/deploy - change finished to committed state
  commit: commitOrRollBack('committed'),

    // Roll back a build/deploy - change finished to rolledBack state
  rollBack: commitOrRollBack('rolledBack'),

    // failed a build/deploy - change finished to rolledBack state
  fail: failDeploy,

    // Cancel a build/deploy - change requested, started, or finished to canceled state
  cancel: cancelDeploy
}
