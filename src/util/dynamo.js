'use strict';

var Promise = require('bluebird'),
    spawn = require('child_process').spawn,
    ChildProcess = require('child_process'),
    path = require('path'),
    execSync = ChildProcess.execSync,
    AWS = require('./aws.js'),
    dynamoTables = require('./dynamoTables.js'),
    win = process.platform === 'win32',
    home = process.env[win ? 'USERPROFILE' : 'HOME'],
    LOCAL_DIR = path.join(home, 'dynamodb_local'),
    dynamoProcess;

function getLocalConfig() {
    return {
        httpOptions: { agent: null },
        profile: 'local',
        accessKeyId: 'LOCALKEY',
        secretAccessKey: 'LOCALSECRET',
        endpoint: 'http://127.0.0.1:8000'
    };
}

function getDriver(local) {
    if (local) {
        return new AWS.DynamoDB(getLocalConfig());
    } else {
        return new AWS.DynamoDB({
            region: 'us-west-2'
        });
    }
}

function createTables() {
    return dynamoTables({
        templates: __dirname + '/../formation/db.js',
        awsConfig: getLocalConfig(),
        verbose: false
    });
}

function killUnix() {
    try {
        var pid = execSync('ps -ef | grep DynamoDBLocal_lib | grep -v grep | awk \'{print $2}\'');

        if (pid && pid.length) {
            execSync('kill ' + pid);
        }
    } catch (e) {
        console.log(e);
    }
}

function killWin() {
    try {
        var pids = execSync('netstat -aon | find ":' + config.dynamo.port + '"');
        if (!pids || !pids.length) {
            return;
        }
        if (/LISTENING\s+(\d+)/.exec(pids.toString()).length > 1) {
            execSync('taskkill /F /PID ' + pids[1]);
        }
    } catch (e) {
        console.log(e);
    }
}

function stop() {
    if (win) {
        killWin();
    } else {
        killUnix();
    }

    return Promise.resolve();
}

function start(verbose) {
    // noinspection JSUnresolvedVariable
    var args = [
        '-Djava.library.path=./DynamoDBLocal_lib',
        '-jar',
        'DynamoDBLocal.jar',
        '-cors',
        '*',
        '-inMemory',
        '-port',
        8000
    ];

    return stop()
        .then(function () {
            console.log('Starting Dynamo...');

            dynamoProcess = spawn('java', args, {
                cwd: LOCAL_DIR,
                env: process.env,
                stdio: verbose ? 'inherit' : 'ignore'
            });

            dynamoProcess
                .on('error', function (err) {
                    console.log('Local DynamoDB start error', err);
                    throw new Error('Local DynamoDB failed to start. ');
                });

            return Promise.delay(500);
        });
}

function startAndCreateTables() {
    return start()
        .then(function () {
            return createTables();
        });
}

function download() {
    var fs = require('fs'),
        gutil = require('gulp-util'),
        fsAccess = Promise.promisify(fs.access),
        gulp = require('gulp'),
        source = require('vinyl-source-stream'),
        s3 = require('vinyl-s3'),
        gunzip = require('gulp-gunzip'),
        untar = require('gulp-untar'),
        request = require('request-promise'),
        progress = require('request-progress'),
        downloadUrl = 'http://dynamodb-local.s3-website-us-west-2.amazonaws.com/dynamodb_local_latest.tar.gz',
        archive = 'dynamodb_local_latest.tar.gz';

    return fsAccess(LOCAL_DIR)
        .catch(function () {
            var requestOptions = {
                url: downloadUrl,
                proxy: process.env.PROXY,
                method: 'GET'
            };

            gutil.log('Installing Local DynamoDb');

            // Here we use gulp and node specific modules to download and unzip/untar
            // the dynamodb install to remain OS agnostic.
            // noinspection JSUnresolvedFunction
            return progress(request(requestOptions))
                .on('progress', function (progress) {
                    gutil.log('DynamoDb ' + Math.floor(progress.percentage * 100) + '% Downloaded...');
                })
                .on('error', function (error) {
                    gutil.log('Unable to download DynamoDb:', error);
                })
                .pipe(source(archive))
                .pipe(gunzip())
                .pipe(untar())
                .pipe(gulp.dest(LOCAL_DIR));
        });
}

module.exports = {
    getDriver: getDriver,
    createTables: createTables,
    start: start,
    startAndCreateTables: startAndCreateTables,
    stop: stop,
    download: download
};
