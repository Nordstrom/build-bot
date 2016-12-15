var rp = require('request-promise'),
    HttpsProxyAgent = require('https-proxy-agent'),
    Promise = require('bluebird'),
    sh = require('shelljs');

const BASE_URL = "https://api.github.com/repos/";
const AUTH_URL = "https://github.com/login/oauth/authorize";
const OWNER = "Nordstrom/";
const BASIC_AUTH = "Basic am9obm55NS1ib3Q6SjBobm55NQ==";
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
    request : function(repo, branch, version){
        if (!repo || !branch || !version){
            return Promise.reject("Invalid request")
        }

        return preCheck(repo, branch)
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
    commitAndRelease : function(repo, branch, version, releaseNotes){
        if (!repo || !branch || !version || !releaseNotes) {
            return Promise.reject("Invalid request")
        }

        return mergeToMaster(repo, branch)
            .then(function(data){
                return release(repo, version, releaseNotes)
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
}

};

module.exports = Github;

function mergeToMaster(repo, branch) {
    if (!repo || !branch) {
        return Promise.reject("Invalid request")
    }

    return merge(repo, "master", branch, MASTER_MERGE_MESSAGE + branch)
        .then(function (data) {
            console.log("Merge to Master Success...");
            return Promise.resolve();
        })
        .catch(function (err) {
            return Promise.reject(err.message);
        })
}

function release(repo, version, notes){
    if (!repo || !version || !notes){
        return Promise.reject("Invalid request, cant merge")
    }

    var params = {
        uri : BASE_URL + OWNER + repo + "/releases",
        method : "POST",
        json : true,
        headers : HEADERS,
        body : {
            "tag_name": version,
            "target_commitish": "master",
            "name": "Release - "+version,
            "body": notes,
            "draft": false,
            "prerelease": false
        }
    };

    params = checkProxy(params);

    return rp(params)
        .then(function(data){
            console.log("Relase Success");
            return Promise.resolve();
        })
        .catch(function(err){
            console.log(err.message);
            return Promise.reject(err);
        })
}

function preCheck(repo, branch) {
    if (!branch || !repo){
        return Promise.reject("Invalid request")
    }

    return merge(repo, branch, "master", MERGE_MESSAGE + branch)
        .then(function(data){
            console.log("Precheck Success...");
            return Promise.resolve();
        })
        .catch(function(err){
            return Promise.reject(err.message);
        })
}

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
            "tag": version,
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


function getUsername(repo, branch){
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
