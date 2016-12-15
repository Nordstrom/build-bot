'use strict';

var AWS = require('aws-sdk'),
    HttpsProxyAgent = require('https-proxy-agent'),
    PROXY = process.env.PROXY,
    PROFILE = process.env.AWS_PROFILE,
    REGION = 'us-west-2';

AWS.config.region = REGION;

if (PROFILE) {
    AWS.config.sslEnabled = true;
    AWS.config.credentials = new AWS.SharedIniFileCredentials({
        profile: PROFILE
    });
    console.log('Using AWS for Profile %s with Region %s using %s',
        PROFILE, REGION, PROXY ? ('Proxy ' + PROXY) : 'No Proxy');
}

AWS.config.httpOptions = {
    agent: PROXY ? new HttpsProxyAgent(PROXY) : undefined
};

module.exports = AWS;
