
global.PROJECT_HOME = __dirname + '/..';
global.SRC_HOME = PROJECT_HOME + '/src';

// global promise library
global.Promise = require('bluebird');

// testing modules
global.sinon = require('sinon');

global.chai = require("chai");
global.expect = require("chai").expect;
global.should = require("chai").should;
chai.should();

global.sinonChai = require('sinon-chai');
chai.use(sinonChai);

global.chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

global.nock = require('nock')

global.AssertionError = require("chai").AssertionError;
