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
    return State.table.destroyAsync({ repo: item.repo, version: item.version });
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
                    repo: build.repo,
                    version: build.version
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
                    repo: build.repo,
                    version: build.version
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
            state: 'rolledBack'
        }, build))
            .then(function () {
                return mgr.start(build);
            })
            .catch(function (err) {
                err.message.should.equal('There is already requested build. Need to Wait...');

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
                return mgr.finish(builds[0]);
            })
            .then(function () {
                return Promise.all([
                    State.table.getAsync({ repo: builds[0].repo, version : builds[0].version }),
                    State.table.getAsync({ repo: builds[1].repo, version : builds[1].version })
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
                return mgr.finish(builds[0])
                    .catch(function (err) {
                        err.message.should.equal('There is no started build yet');

                    });
            })
            .then(function () {
                return Promise.all([
                    State.table.getAsync({ repo: builds[0].repo, version : builds[0].version }),
                    State.table.getAsync({ repo: builds[1].repo, version : builds[1].version })
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

    it('fail started build with success', function () {
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
                return mgr.fail(builds[1]);
            })
            .then(function () {
                return Promise.all([
                    State.table.getAsync({ repo: builds[0].repo, version : builds[0].version }),
                    State.table.getAsync({ repo: builds[1].repo, version : builds[1].version })
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
                return mgr.fail(builds[1])
                    .catch(function (err) {
                        err.message.should.equal('There is no build started or finished');
                    });
            })
            .then(function () {
                return Promise.all([
                    State.table.getAsync({ repo: builds[0].repo, version : builds[0].version }),
                    State.table.getAsync({ repo: builds[1].repo, version : builds[1].version })
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
                return mgr.commit(builds[1]);
            })
            .then(function () {
                return Promise.all([
                    State.table.getAsync({ repo: builds[0].repo, version : builds[0].version }),
                    State.table.getAsync({ repo: builds[1].repo, version : builds[1].version})
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
                return mgr.rollBack(builds[1]);
            })
            .then(function () {
                return Promise.all([
                    State.table.getAsync({ repo: builds[0].repo, version : builds[0].version }),
                    State.table.getAsync({ repo: builds[1].repo, version : builds[1].version })
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
                return mgr.rollBack(builds[1])
                    .catch(function(err){
                        err.message.should.equal('There is no build to be committed/rolled back yet');
                    })
            })
            .then(function () {
                return Promise.all([
                    State.table.getAsync({ repo: builds[0].repo, version : builds[0].version }),
                    State.table.getAsync({ repo: builds[1].repo, version : builds[1].version })
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
