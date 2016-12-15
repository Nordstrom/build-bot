var rp = require('request-promise'),
    HttpsProxyAgent = require('https-proxy-agent'),
    Promise = require('bluebird'),
    sh = require('shelljs');

const BASE_URL = "https://api.github.com/repos/";
const AUTH_URL = "https://github.com/login/oauth/authorize";
const OWNER = "Nordstrom/";
const BASIC_AUTH = "Basic amFzb25vbG1zdGVhZDMzOkJAc2ViYWxsMzM=";
const MERGE_MESSAGE = "Merging master into branch: ";
const TAG_MESSAGE = "Tagging branch for deploy. Tag: ";
const MASTER_MERGE_MESSAGE = "[skip ci] Merging into master from: ";
const HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": "Hackathon-Local-Dev",
    "Authorization": BASIC_AUTH
};

var Github = {
    getUsername : function(repo, branch){
        if (!repo || !branch){
            return Promise.reject("Invalid request, cant merge")
        }
        var params = {
            uri : BASE_URL + OWNER + repo + "branches/"+branch,
            method : "GET",
            json : true,
            headers : HEADERS
        };

        params = checkProxy(params);

        return rp(params)
            .then(function(data){
                console.log("success");
                var user = data.commit.commit.author.email;
                return Promise.resolve(user);
            })
            .catch(function(err){
                console.log(err.message);
                return Promise.reject(err);
            })
    },


    
    push : function(repo, branch, message){
        if (!branch || !message || !repo){
            return Promise.reject("Invalid Arguments");
        }
        var result = sh.exec('git add .');
        if (result.code == 1){
            return Promise.reject("Error on git add");
        }
        result = sh.exec('git commit -m "bot-commit: ' + message + '"');
        if (result.code == 1){
            return Promise.reject("Error on git commit");
        }
        result = sh.exec('git push origin ' + branch);
        if (result.code == 1){
            return Promise.reject("Error on git push");
        }
        return Promise.resolve();
    },

    mergeToMaster : function(repo, branch) {
        if (!repo || !branch) {
            return Promise.reject("Invalid request")
        }

        return merge(repo, "master", branch, MASTER_MERGE_MESSAGE + branch)
            .then(function (data) {
                console.log("Success...");
            })
            .catch(function (err) {
                if (err.message.message.indexOf("409")) {
                    return Promise.reject("Conflict merging " + branch + "into master");
                } else {
                    return Promise.reject(err.message);
                }
            })
    },

    preCheck : function(repo, branch) {
        if (!branch || !repo){
            return Promise.reject("Invalid request")
        }

        return merge(repo, branch, "master", MERGE_MESSAGE + branch)
            .then(function(data){
                console.log("Success...");
                return Promise.resolve();
            })
            .catch(function(err){
                if (err.message.message.indexOf("409") > -1){
                    return Promise.reject("Conflict merging master into " + branch);
                } else {
                    return Promise.reject(err.message);
                }
            })
    },

    request : function(repo, branch, version){
        if (!repo || !branch || !version){
            return Promise.reject("Invalid request")
        }

        this.preCheck(repo, branch)
            .then(function(data){
                if (!!data){
                    var sha = data.sha;
                    return tag(repo, sha, version);
                } else {
                    return getBranchInfo(repo, branch)
                        .then(function(data){
                            var sha = data.commit.sha;
                            return tag(repo, sha, version);
                        })
                }
            })
            .then(function(data){
                return createReference(repo, data.sha, data.tag);
            })
            .catch(function(err){
                console.log(err.message);
            })

    },

    release : function(repo, version, notes){
        if (!repo || !version || !notes){
            return Promise.reject("Invalid request, cant merge")
        }

        var params = {
            uri : BASE_URL + OWNER + repo + "/releases",
            method : "POST",
            json : true,
            headers : HEADERS,
            body : {
                "tag_name": "v" + version,
                "target_commitish": "master",
                "name": "Release - v"+version,
                "body": notes,
                "draft": false,
                "prerelease": false
            }
        };

        params = checkProxy(params);

        return rp(params)
            .then(function(data){
                console.log("success");
                return Promise.resolve();
            })
            .catch(function(err){
                console.log(err.message);
                return Promise.reject(err);
            })
    }
};

module.exports = Github;

function tag(repo, sha, version){
    if (!repo || !sha || !version){
        return Promise.reject("Invalid request")
    }

    var params = {
        uri : BASE_URL + OWNER + repo + "/git/tags",
        method : "POST",
        json : true,
        headers : HEADERS,
        body : {
            "tag": "v"+version,
            "message": TAG_MESSAGE+version,
            "object": sha,
            "type" : "commit",
            "tagger" : {
                "name": "johnny5",
                "email": "johnny5@nordstrom.com",
                "date": new Date()
            }
        }
    };

    params = checkProxy(params);

    return rp(params);
}

function getBranchInfo(repo, branch){
    if (!repo || !branch){
        return Promise.reject("Invalid request")
    }

    var params = {
        uri : BASE_URL + OWNER + repo + "/branches/" + branch,
        method : "GET",
        json : true,
        headers : HEADERS
    };

    params = checkProxy(params);

    return rp(params);
}

function createReference(repo, sha, tag){
    if (!repo || !tag){
        return Promise.reject("Invalid request, cant merge")
    }

    var params = {
        uri : BASE_URL + OWNER + repo + "/git/refs",
        method : "POST",
        json : true,
        headers : HEADERS,
        body : {
            "ref": 'refs/tags/'+tag,
            "sha": sha
        }
    };

    params = checkProxy(params);

    return rp(params);
}

function merge(repo, base, head, message){
    if (!repo || !base || !head || !message){
        return Promise.reject("Invalid request, cant merge")
    }

    var params = {
        uri : BASE_URL + OWNER + repo + "/merges",
        method : "POST",
        json : true,
        headers : HEADERS,
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

// Github.request("build-bot", "test-bot-branch", "0.0.10");
// createReference("build-bot", "20ee116227ec18666dc823ede06a3d3710fb05d3", "v0.0.8");
//Github.preCheck('test-bot-branch');
// Github.getUsername('test-bot-branch')
//     .then(function(data){
//         console.log(data);
//     });
//Github.push('test-bot-branch', "Testing flow with version update");
//Github.mergeToMaster('test-bot-branch');
//Github.release("0.0.5", "Github Release Notes");
