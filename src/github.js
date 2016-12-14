var rp = require('request-promise'),
    HttpsProxyAgent = require('https-proxy-agent');;

const BASE_URL = "https://api.github.com/repos/";
const AUTH_URL = "https://github.com/login/oauth/authorize";
const OWNER = "Nordstrom/";
const REPO = "build-bot/";
const TOKEN = "access_token=0fe2c88a900ed9d2e13eaeb375176ccb3d4636d8";
const CLIENT_ID_AND_SECRET = "client_id=9536727b9f252ceb5e03&client_secret=8ebef8e5e15d50472b3656d70bd2cec5ad887e0f";
const BASIC_AUTH = "Basic amFzb25vbG1zdGVhZDMzOkJAc2ViYWxsMzM=";

var Github = {
    commit : function(){
        console.log("Committing...")
    },
    authorizeAsync : function(){
        var params = {
            method : "GET",
            uri : AUTH_URL + "?client_id=" + CLIENT_ID
        };

        if (!!process.env.LOCAL){
            params.agent = new HttpsProxyAgent("http://webproxysea.nordstrom.net:8181");
        }

        return rp(params)
            .then(function(data){
                console.log(data);
            })
    },
    mergeAsync : function(base, head, message){
        if (!base || !head || !message){
            return Promise.reject("Invalid request")
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

        if (!!process.env.LOCAL){
            params.agent = new HttpsProxyAgent("http://webproxysea.nordstrom.net:8181");
        }

        return rp(params)
            .then(function(data){
                console.log("DATA")
                console.log(data);
            })
            .catch(function(err){
                console.log("ERR")
                console.log(err.message);
                console.log(err.response.headers);
            })
    }
};

module.exports = Github;

//Github.authorizeAsync()
Github.mergeAsync("test-bot-branch", "master", "First merge of bot branches")
