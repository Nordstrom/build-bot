'use strict';

var _ = require('lodash'),
    Promise = require('bluebird'),
    should = require('should'),
    vogels = require('../src/util/vogels.js'),
    dynamo = require('../src/util/dynamo.js'),
    State = require('../src/models/state.js'),
    mgr = require('../src/mgr.js');

function loadItems(data) {
    console.log('Deleting %s Items...', data && data.Items && data.Items.length);
    return data.Items;
}

function deleteBuildState(data) {
    var item = data && data.get();
    console.log('Destroy Build State: ', item.repo);
    return State.table.destroyAsync({ repo: item.repo });
}

describe.skip('Test Mgr', function () {
    before(function () {
        vogels.setDriver(true);
        console.log('Creating DB');
        return dynamo.startAndCreateTables();
    });

    after(function () {
        return dynamo.stop();
    });

    beforeEach(function () {
        return State.table
            .scan()
            .execAsync()
            .then(loadItems)
            .map(deleteBuildState);

    });

    it('request build success with no record', function () {
        var build = {
            repo: 'testRepo',
            branch: 'testBranch',
            version: '1.0'
        };
        return mgr.request(build)
            .then(function () {
                return State.table.getAsync({
                    repo: 'testRepo'
                });
            })
            .then(function (data) {
                var rec = data && data.get();
                _.omit(rec, ['updated']).should.eql(_.merge({
                    state: 'requested'
                }, build));
            });
    });

    it('request build failure with existing build', function () {
        var build = {
            repo: 'testRepo',
            branch: 'testBranch',
            version: '1.0'
        };
        return State.create(_.merge({
            state: 'started'
        }, build))
            .then(function (data) {
                return mgr.request(build);
            })
            .catch(function (err) {
                err.message.should.equal('Cannot request a deploy since there is one going on');

            });
    });

    it('start build success', function () {
        var build = {
            repo: 'testRepo',
            branch: 'testBranch',
            version: '1.0'
        };
        return State.create(_.merge({
            state: 'requested'
        }, build))
            .then(function () {
                return mgr.start(build);
            })
            .then(function () {
                return State.table.getAsync({
                    repo: build.repo
                });
            })
            .then(function (data) {
                var rec = data && data.get();
                _.omit(rec, ['updated']).should.eql(_.merge({
                    state: 'started'
                }, build));
            });
    });

    it('start build fail with not request', function () {
        var build = {
            repo: 'testRepo',
            branch: 'testBranch',
            version: '1.0'
        };
        return State.create(_.merge({
            state: 'requested'
        }, build))
            .then(function () {
                return mgr.start(_.merge(build, { version: '1.1' }));
            })
            .catch(function (err) {
                err.message.should.equal('build has not been requested for the same branch or version');

            });
    });

    it('finish build success', function () {
        var builds = [{
            repo: 'testRepo',
            branch: 'testBranch',
            version: '1.0',
            state: 'started'
        },
            {
                repo: 'testRepo2',
                branch: 'testBranch2',
                version: '2.0',
                state: 'rolledBack'
            }];
        return Promise.all([
            State.create(_.assign({}, builds[0])),
            State.create(_.assign({}, builds[1]))
        ])
            .then(function () {
                return mgr.finish();
            })
            .then(function () {
                return Promise.all([
                    State.table.getAsync({ repo: builds[0].repo }),
                    State.table.getAsync({ repo: builds[1].repo })
                ]);
            })
            .then(function (results) {
                var rec1 = results[0] && results[0].get(),
                    rec2 = results[1] && results[1].get();
                _.omit(rec1, ['updated']).should.eql(_.merge(builds[0], {
                    state: 'finished'
                }));
                _.omit(rec2, ['updated']).should.eql(_.merge(builds[1], {
                    state: 'rolledBack'
                }));
            });

    });

    it('finish build fail with error', function () {
        var builds = [{
            repo: 'testRepo',
            branch: 'testBranch',
            version: '1.0',
            state: 'requested'
        },
            {
                repo: 'testRepo2',
                branch: 'testBranch2',
                version: '2.0',
                state: 'rolledBack'
            }];
        return Promise.all([
            State.create(_.assign({}, builds[0])),
            State.create(_.assign({}, builds[1]))
        ])
            .then(function () {
                return mgr.finish()
                    .catch(function (err) {
                        err.message.should.equal('There is no started build yet');

                    });
            })
            .then(function () {
                return Promise.all([
                    State.table.getAsync({ repo: builds[0].repo }),
                    State.table.getAsync({ repo: builds[1].repo })
                ]);
            })
            .then(function (results) {
                var rec1 = results[0] && results[0].get(),
                    rec2 = results[1] && results[1].get();
                _.omit(rec1, ['updated']).should.eql(_.merge(builds[0], {
                    state: 'requested'
                }));
                _.omit(rec2, ['updated']).should.eql(_.merge(builds[1], {
                    state: 'rolledBack'
                }));
            });
    });

    it('fail started build success', function () {
        var builds = [{
            repo: 'testRepo',
            branch: 'testBranch',
            version: '1.0',
            state: 'committed'
        },
            {
                repo: 'testRepo2',
                branch: 'testBranch2',
                version: '2.0',
                state: 'started'
            }];
        return Promise.all([
            State.create(_.assign({}, builds[0])),
            State.create(_.assign({}, builds[1]))
        ])
            .then(function () {
                return mgr.fail();
            })
            .then(function () {
                return Promise.all([
                    State.table.getAsync({ repo: builds[0].repo }),
                    State.table.getAsync({ repo: builds[1].repo })
                ]);
            })
            .then(function (results) {
                var rec1 = results[0] && results[0].get(),
                    rec2 = results[1] && results[1].get();
                _.omit(rec1, ['updated']).should.eql(_.merge(builds[0], {
                    state: 'committed'
                }));
                _.omit(rec2, ['updated']).should.eql(_.merge(builds[1], {
                    state: 'failed'
                }));
            });
    });

    it('fail build with error', function () {
        var builds = [{
            repo: 'testRepo',
            branch: 'testBranch',
            version: '1.0',
            state: 'committed'
        },
            {
                repo: 'testRepo2',
                branch: 'testBranch2',
                version: '2.0',
                state: 'requested'
            }];
        return Promise.all([
            State.create(_.assign({}, builds[0])),
            State.create(_.assign({}, builds[1]))
        ])
            .then(function () {
                return mgr.fail()
                    .catch(function (err) {
                        err.message.should.equal('There is no build started or finished');
                    });
            })
            .then(function () {
                return Promise.all([
                    State.table.getAsync({ repo: builds[0].repo }),
                    State.table.getAsync({ repo: builds[1].repo })
                ]);
            })
            .then(function (results) {
                var rec1 = results[0] && results[0].get(),
                    rec2 = results[1] && results[1].get();
                _.omit(rec1, ['updated']).should.eql(_.merge(builds[0], {
                    state: 'committed'
                }));
                _.omit(rec2, ['updated']).should.eql(_.merge(builds[1], {
                    state: 'requested'
                }));
            });
    });

    it('commit build success', function () {
        var builds = [{
            repo: 'testRepo',
            branch: 'testBranch',
            version: '1.0',
            state: 'committed'
        },
            {
                repo: 'testRepo2',
                branch: 'testBranch2',
                version: '2.0',
                state: 'finished'
            }];
        return Promise.all([
            State.create(_.assign({}, builds[0])),
            State.create(_.assign({}, builds[1]))
        ])
            .then(function () {
                return mgr.commit();
            })
            .then(function () {
                return Promise.all([
                    State.table.getAsync({ repo: builds[0].repo }),
                    State.table.getAsync({ repo: builds[1].repo })
                ]);
            })
            .then(function (results) {
                var rec1 = results[0] && results[0].get(),
                    rec2 = results[1] && results[1].get();
                _.omit(rec1, ['updated']).should.eql(_.merge(builds[0], {
                    state: 'committed'
                }));
                _.omit(rec2, ['updated']).should.eql(_.merge(builds[1], {
                    state: 'committed'
                }));
            });
    });

    it('commit build success', function () {
        var builds = [{
            repo: 'testRepo',
            branch: 'testBranch',
            version: '1.0',
            state: 'committed'
        },
            {
                repo: 'testRepo2',
                branch: 'testBranch2',
                version: '2.0',
                state: 'finished'
            }];
        return Promise.all([
            State.create(_.assign({}, builds[0])),
            State.create(_.assign({}, builds[1]))
        ])
            .then(function () {
                return mgr.rollBack();
            })
            .then(function () {
                return Promise.all([
                    State.table.getAsync({ repo: builds[0].repo }),
                    State.table.getAsync({ repo: builds[1].repo })
                ]);
            })
            .then(function (results) {
                var rec1 = results[0] && results[0].get(),
                    rec2 = results[1] && results[1].get();
                _.omit(rec1, ['updated']).should.eql(_.merge(builds[0], {
                    state: 'committed'
                }));
                _.omit(rec2, ['updated']).should.eql(_.merge(builds[1], {
                    state: 'rolledBack'
                }));
            });
    });

    it('rollback with error', function () {
        var builds = [{
            repo: 'testRepo',
            branch: 'testBranch',
            version: '1.0',
            state: 'committed'
        },
            {
                repo: 'testRepo2',
                branch: 'testBranch2',
                version: '2.0',
                state: 'started'
            }];
        return Promise.all([
            State.create(_.assign({}, builds[0])),
            State.create(_.assign({}, builds[1]))
        ])
            .then(function () {
                return mgr.rollBack()
                    .catch(function(err){
                        err.message.should.equal('There is no build to be committed/rolled back yet');
                    })
            })
            .then(function () {
                return Promise.all([
                    State.table.getAsync({ repo: builds[0].repo }),
                    State.table.getAsync({ repo: builds[1].repo })
                ]);
            })
            .then(function (results) {
                var rec1 = results[0] && results[0].get(),
                    rec2 = results[1] && results[1].get();
                _.omit(rec1, ['updated']).should.eql(_.merge(builds[0], {
                    state: 'committed'
                }));
                _.omit(rec2, ['updated']).should.eql(_.merge(builds[1], {
                    state: 'started'
                }));
            });
    });
});
