'use strict';

var _ = require('lodash'),
    should = require('should'),
    mockery = require('mockery'),
    assert = require('assert'),
    Promise = require('bluebird');

var github;

var rpMock = function(params){

};

var shellMock = {
    exec : function(command, options){
        return {
            code: 0,
            stdout: "[test-bot-branch b96414d] bot-commit: Testing flow with version update\n"+
            "1 file changed, 1 insertion(+), 2 deletions(-)\n"+
            "To https://github.com/Nordstrom/build-bot.git\n"+
            "286d005..b96414d  test-bot-branch -> test-bot-branch"
        }
    }
};


describe('Test Github', function () {
    before(function () {
        mockery.registerMock("rp", rpMock);
        mockery.registerMock("shelljs", shellMock);
        mockery.enable({
            useCleanCache : true,
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        github = require('../src/github');
    });


    it('should push to git', function () {
        return github.push("test-branch", "message")
            .then(function(data){
                return Promise.resolve(data)
            })
            .catch(function(err){
                return Promise.reject();
            })
    });

    it('should reject if Github.push has no branch', function () {
        return github.push(null, "Message")
            .then(function(data){
                return Promise.reject(data)
            })
            .catch(function(err){
                err.should.be.ok;
                return Promise.resolve();
            })
    });

    it('should reject if Github.push has no message', function () {
        return github.push("test-branch", null)
            .then(function(data){
                return Promise.reject(data)
            })
            .catch(function(err){
                err.should.be.ok;
                return Promise.resolve();
            })
    });
});
