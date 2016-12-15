'use strict';

var shellMock = {
    exec : function(command, options){
       return {
           code: 0,
           stdout: "v0.0.1\n"
       }
    }
};

var _ = require('lodash'),
    should = require('should'),
    mockery = require('mockery'),
    assert = require('assert');

var versioning;

describe('Test Versioning', function () {
    before(function () {
        mockery.registerMock("shelljs", shellMock);
        mockery.enable({
            useCleanCache : true,
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        versioning = require('../src/versioning');
    });


    it('should successfully update on major update', function () {
        var version = versioning.update("major");
        version.should.equal("0.0.1")
    });

    it('should successfully update on minor update', function () {
        var version = versioning.update("minor");
        version.should.equal("0.0.1")
    });

    it('should successfully update on patch update', function () {
        var version = versioning.update("patch");
        version.should.equal("0.0.1")
    });

    it('should throw error on update with no type', function () {
        assert.throws(function(){
            versioning.update();
        }, function(err){
            return err.message.indexOf("Not valid version update type") > -1;
        })
    });

    it('should throw error on update with invalid type', function () {
        assert.throws(function(){
            versioning.update("Invalid");
        }, function(err){
            return err.message.indexOf("Not valid version update type") > -1;
        })
    })
});
