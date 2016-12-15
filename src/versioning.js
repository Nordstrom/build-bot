var rp = require('request-promise'),
    Promise = require('bluebird'),
    sh = require('shelljs');

const PATCH = "patch";
const MAJOR = "major";
const MINOR = "minor";

var Versioning = {
    update : function(type){
        if (type != PATCH && type != MAJOR && type != MINOR){
            throw new Error("Not valid verstion update type");
        }
        var result = sh.exec("npm version " + type + " --force");
        console.log(result);
        if (result.code == 1){
            throw new Error("Error updating version");
        } 
        var version = result.stdout.replace('\n', "").replace("v", "");
        return version;
    }
};

module.exports = Versioning;


//** TEST CODE ****/
console.log(Versioning.update("major"));

