'use strict';

var _ = require('lodash'),
    vogels = require('vogels-promisified');

function setDriver(local) {
    var dynamo = require('./dynamo.js');
    console.log('Setting Vogels Driver local=' + local);

    var driver = dynamo.getDriver(local);
    vogels.dynamoDriver(driver);

    console.log(JSON.stringify(driver));
    vogels.log.level('debug');

    return vogels;
}

function scanTable(model) {
    return model.scan()
        .execAsync()
        .then(function (data) {
            console.log('Scan ' + model.tableName() + ' Returns ' + data.Count + ' Records');

            _.forEach(data.Items, function (item) {
                console.log(item.get());
            });
        });
}


// setDriver(!(process.env.REMOTE_DYNAMO || args.remote));
// vogels.log.level('debug');

vogels.setDriver = setDriver;
vogels.scanTable = scanTable;
module.exports = vogels;
