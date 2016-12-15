// 'use strict';
//
// var _ = require('lodash'),
//     should = require('should'),
//     vogels = require('../src/util/vogels.js'),
//     dynamo = require('../src/util/dynamo.js'),
//     State = require('../src/models/state.js'),
//     mgr = require('../src/mgr.js');
//
// function loadItems(data) {
//     console.log ('Deleting %s Items...', data && data.Items && data.Items.length);
//     return data.Items;
// }
//
// function deleteBuildState(data) {
//     var item = data && data.get();
//     console.log('Destroy Build State: ', item.repo);
//     return State.table.destroyAsync({repo: item.repo});
// }
//
// describe('Test Mgr', function () {
//     before(function () {
//         vogels.setDriver(true);
//         console.log('Creating DB');
//         return dynamo.startAndCreateTables();
//     });
//
//     beforeEach(function () {
//         return State.table
//             .scan()
//             .execAsync()
//             .then(loadItems)
//             .map(deleteBuildState);
//
//     });
//
//     it('request build success with no record', function () {
//         var build = {
//             repo: 'testRepo',
//             branch: 'testBranch',
//             version: '1.0'
//         };
//         return mgr.request(build)
//             .then(function (data) {
//                 return State.table.getAsync({
//                     repo: 'testRepo'
//                 });
//             })
//             .then(function (data) {
//                 var rec = data && data.get();
//                 _.omit(rec, ['updated']).should.eql(_.merge({
//                     state: 'requested'
//                 }, build));
//             });
//     });
//
//     it('request build failure with existing build', function () {
//         var build = {
//             repo: 'testRepo',
//             branch: 'testBranch',
//             version: '1.0'
//         };
//         return State.create(_.merge({
//             state: 'started'
//         }, build))
//             .then(function (data) {
//                 return mgr.request(build);
//             })
//             .catch(function (err) {
//                err.message.should.equal('Cannot request a deploy since there is one going on');
//
//             });
//     })
// });
