var rp = require('request-promise'),
    Promise = require('bluebird'),
    HttpsProxyAgent = require('https-proxy-agent');

const DRONE_BASE = "https://drone-hackathon-1963538104.us-west-2.elb.amazonaws.com";
const DRONE_PATH = "/api/repos/Nordstrom/{repo}";
const HEADERS = {
    "Content-Type" : "application/json"
};

var Drone = {
    getStatus : function(repo){
        if (!repo){
            return Promise.reject("Invalid Arguments")
        }
        var path = DRONE_PATH.replace("{repo}", repo);

        var params = {
            uri : DRONE_BASE + path + '/builds',
            method : "GET",
            json : true,
            rejectUnauthorized : false,
            headers : HEADERS
        };

        params = checkProxy(params);

        return rp(params)
            .then(function(data){
                var build = data[0];
                var status = build.status;
                console.log(status);
                return Promise.resolve(status);
            })
            .catch(function(err){
                return Promise.reject(err.message);
            })
    }
};

module.exports = Drone;

function getRepo(repo){
    if (!repo){
        return Promise.reject("Invalid Arguments")
    }
    var path = DRONE_PATH.replace("{repo}", repo);

    var params = {
        uri : DRONE_BASE + path,
        method : "GET",
        json : true,
        rejectUnauthorized : false,
        headers : HEADERS
    };

    params = checkProxy(params);

    return rp(params)
        .then(function(data){
            console.log(data);

        })
        .catch(function(err){
            console.log(err);
        })
}


function checkProxy(params){
    if (!!process.env.LOCAL){
        params.agent = new HttpsProxyAgent("http://webproxysea.nordstrom.net:8181");
    }
    return params;
}

//** TEST CODE ****/
//getRepo("build-bot");
Drone.getStatus("build-bot");