'use strict';

var _ = require('lodash'),
    vogels = require('../util/vogels.js'),
    joi = require('joi'),
    table = vogels.define('State', {
        tableName: 'Hackathan-Build-Bot-State',
        hashKey: 'repo',
        schema: {
            repo: joi.string(),
            branch: joi.string(),
            version: joi.string(),
            state: joi.string(),
            updated: joi.number()
        }
    });


function getBranchesInStates(states) {

    return table.scan()
        .where('state').in(states)
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