'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    Promise = require('bluebird'),
    glob = Promise.promisify(require('glob')),
    AWS = require('aws-sdk');

module.exports = function (opts) {
    var globPattern = opts.templates,
        config = opts.awsConfig,
        verbose = opts.verbose,
        dynamoDb = Promise.promisifyAll(new AWS.DynamoDB(config)),
        log = verbose ? console.log : _.noop,
        tables = [];

    return Promise.each(glob(globPattern), function (file) {
        var tmpl = _.endsWith(file, '.js')
                ? require(file)
                : JSON.parse(fs.readFileSync(file, 'utf8')),
            resources = _.values(tmpl.Resources);

        _.forEach(resources, function (resource) {
            if (resource.Type === 'AWS::DynamoDB::Table') {
                var table = _.cloneDeep(resource.Properties);
                if (table.StreamSpecification) {
                    delete table.StreamSpecification;
                }
                tables.push(table);
            }
        });
    })
        .then(function () {
            return tables;
        })
        .map(function (table) {
            log('Creating', table.TableName);
            return dynamoDb.createTableAsync(table)
                .then(function () {
                    return new Promise(function (resolve, reject) {
                        var timeout;

                        function checkStatus() {
                            log('Checking', table.TableName);

                            dynamoDb.describeTable({ TableName: table.TableName }, function (err, data) {
                                if (err) {
                                    clearTimeout(timeout);
                                    return reject(err);
                                }
                                if (data.Table.TableStatus === 'ACTIVE') {
                                    log('Table ' + table.TableName + ' ACTIVE');
                                    clearTimeout(timeout);
                                    return resolve();
                                }

                                setTimeout(checkStatus, 200);
                            });
                        }

                        timeout = setTimeout(checkStatus, 200);
                    });
                })
                .then(function () {
                    log('Created', table.TableName);
                })
                .catch(function (err) {
                    console.log(err);
                });
        });
};
