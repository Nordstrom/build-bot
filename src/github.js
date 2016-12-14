var rp = require('request-promise'),
    HttpsProxyAgent = require('https-proxy-agent'),
    Promise = require('bluebird'),
    sh = require('shelljs');

const BASE_URL = "https://api.github.com/repos/";
const AUTH_URL = "https://github.com/login/oauth/authorize";
const OWNER = "Nordstrom/";
const REPO = "build-bot/";
const BASIC_AUTH = "Basic amFzb25vbG1zdGVhZDMzOkJAc2ViYWxsMzM=";
const MERGE_MESSAGE = "Merging master into branch: ";
const MASTER_MERGE_MESSAGE = "Merging into master from: ";

var Github = {
    push : function(message){
        var code = sh.exec('git add .');
        if (code == 1){
            return Promise.reject("Error on git add");
        }
        code = sh.exec('git commit -m "auto commit from bot: ' + message + '"');
        if (code == 1){
            return Promise.reject("Error on git commit");
        }

    },
    preCheck : function(branch) {
        if (!branch){
            return Promise.reject("Invalid request -- need branch name")
        }

        return merge(branch, "master", MERGE_MESSAGE + branch)
            .then(function(){
                console.log("Success...");
            })
            .catch(function(err){
                if (err.message.message.indexOf("409")){
                    return Promise.reject("Conflict merging master into " + branch);
                } else {
                    return Promise.reject(err.message);
                }
            })
    },

    mergeToMaster : function(branch){
        if (!branch){
            return Promise.reject("Invalid request -- need branch name")
        }

        return merge("master", branch, MASTER_MERGE_MESSAGE + branch)
            .then(function(){
                console.log("Success...");
            })
            .catch(function(err){
                if (err.message.message.indexOf("409")){
                    return Promise.reject("Conflict merging " + branch + "into master");
                } else {
                    return Promise.reject(err.message);
                }
            })
    }
};

module.exports = Github;


function merge(base, head, message){
    if (!base || !head || !message){
        return Promise.reject("Invalid request, cant merge")
    }

    var params = {
        uri : BASE_URL + OWNER + REPO + "merges",
        method : "POST",
        json : true,
        headers : {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent" : "Hackathon-Local-Dev",
            "Authorization" : BASIC_AUTH
        },
        body : {
            "base": base,
            "head": head,
            "commit_message": message
        }
    };

    params = checkProxy(params);

    return rp(params);
}

function checkProxy(params){
    if (!!process.env.LOCAL){
        params.agent = new HttpsProxyAgent("http://webproxysea.nordstrom.net:8181");
    }
    return params;
}




//** TEST CODE ****/
Github.push("testing push from shelljs");
