'use strict'

const Promise = require('bluebird')

function lambdize(fn) {
    return (event, context, cb) => {
        fn(event, context).then(res => {
            cb(null, res)
        }).catch(err => {
            cb(err, null)
        })
    }
}

function handle(event, context) {
    return Promise.resolve({
        statusCode: 200,
        body: JSON.stringify({

        })
    })
}

function message() {}

module.exports = {
	/* eslint no-unused-vars: "off" */
    handle: lambdize(handle),
    message
}
