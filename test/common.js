
global.PROJECT_HOME = __dirname + '..';
global.SRC_HOME = PROJECT_HOME + '/src';

// global promise library
global.Promise = require('bluebird');

// testing modules
global.chai = require("chai");
global.expect = require("chai").expect;
global.should = require("chai").should;
chai.should();

global.AssertionError = require("chai").AssertionError;

