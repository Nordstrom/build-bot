var rp = require('request-promise'),
    Promise = require('bluebird'),
    sh = require('shelljs');

const PATCH = "patch";
const MAJOR = "major";
const MINOR = "minor";

var Versioning = {
    update : function(type){
        if (type != PATCH && type != MAJOR && type != MINOR) {
            throw new Error("Not valid verstion update type");
        }
        var result = sh.exec("npm version " + type + " --force", {silent : true});
        if (result.code == 1){
            throw new Error("Error updating version");
        } 
        var version = result.stdout.replace('\n', "").replace("v", "");
        console.log("Updated to version: v" + version);
        return version;
    }
};

module.exports = Versioning;


//** TEST CODE ****/
//console.log(Versioning.update("patch"));
//console.log(Versioning.update("minor"));
//console.log(Versioning.update("major"));
