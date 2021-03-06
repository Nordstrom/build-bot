'use strict';

var _ = require('lodash'),
    vogels = require('../util/vogels.js'),
    joi = require('joi'),
    table = vogels.define('State', {
        tableName: 'build-bot-state',
        hashKey: 'repo',
        rangeKey: 'version',
        schema: {
            repo: joi.string(),
            branch: joi.string(),
            version: joi.string(),
            state: joi.string(),
            updated: joi.number()
        }
    });


function getBranchesInStates(repo, states) {

    return table.query(repo)
        .filter('state').in(states)
        .execAsync()
        .then(function (data) {
            return {
                items: data.Items ? _.map(data.Items, function (item) {
                    return item.get();
                }) : []
            };
        });
}

function create(build) {
    build.updated = Date.now();
    return table.createAsync(build, { overwrite: true })
        .then(function (data) {
            return data && data.get();
        });
}

function update(build) {
    return table.updateAsync({
        repo: build.repo,
        version: build.version,
        state: build.state,
        updated: Date.now()
    })
        .then(function (data) {
            return data && data.get();
        });
}

module.exports = {
    table: table,
    getBranchesInStates: getBranchesInStates,
    create: create,
    update: update
}
