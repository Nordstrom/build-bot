'use strict';

var _ = require('lodash'),
    Promise = require('bluebird'),
    request = require('request-promise'),
    JIRA_HOST = 'https://build-bot-demo.atlassian.net/rest/',
    JIRA_URL = JIRA_HOST + 'api/2/',
    JIRA_DEV_STATUS_URL = JIRA_HOST + 'dev-status/latest/issue/detail?issueId={issueId}&applicationType={repoType}&dataType={dataType}',
    GIT_JIRA_MAP = {
        'andyday': 'andy.day@nordstrom.com',
        'steinbergkh': 'katie.h.steinberg@nordstrom.com',
        'JorjikS': 'jane.savina@nordstrom.com',
        'yunwang240': 'yun.wang@nordstrom.com',
        'jasonolmstead33': 'jason.olmstead@nordstrom.com',
        'rathoretribhuvan': 'tribhuvan.rathore@nordstrom.com'
    };

function release(branch, releaseName, buildUserData, options) {
    var releaseOptions = {
        repository: 'github',
        searchRepoDataType: 'branch',
        issueReleasedStatus: 'Done'
    };

    _.merge(releaseOptions, options);

    var jiraApiOptions = {},
        transitions;

    function authenticateAndInitializeOptions(options) {
        // console.log('authentication...');
        // TODO: OAuth for JIRA.
        return Promise.resolve({
            headers: {
                'Content-Type': 'application/json',
                Cookie: 'atlassian.xsrf.token=B6JY-L235-ELCS-GFF8|99beade9572baac72c7ca825390e59bc714d8393|lin; studio.crowd.tokenkey=bot8hWjfLVE8UaM1FOLpOA00'
            },
            json: true
        });
    }

    function findUser(buildUserData) {
        var userEmail = GIT_JIRA_MAP[buildUserData];
        // console.log('looking for user [' + buildUserData + '/' + userEmail + ']');
        return request.get(JIRA_URL + 'user/search?username=' + userEmail, jiraApiOptions)
            .then(function (userRecords) {
                // console.log('results from search user:', userRecords);
                if (!userRecords || userRecords.length !== 1) {
                    throw new Error('Can\'t find user ' + buildUserData + '/' + userEmail);
                }
                return {
                    key: userRecords[0].key,
                    name: userRecords[0].name,
                    emailAddress: userRecords[0].emailAddress
                };
            });
    }

    function findStories(jiraUser) {
        // console.log('quering JIRA for stories for user.id=', jiraUser.key);
        return request.get(JIRA_URL + 'search?jql=assignee=' + jiraUser.key, jiraApiOptions)
            .then(function (results) {
                return _.map(results.issues, function (item) {
                    return {
                        id: item.id,
                        url: item.self,
                        key: item.key,
                        summary: item.fields.summary,
                        description: item.fields.description,
                        status: {
                            id: item.fields.status.id,
                            name: item.fields.status.name,
                            description: item.fields.status.description
                        },
                        project: {
                            id: item.fields.project.id,
                            name: item.fields.project.name,
                            key: item.fields.project.key
                        }
                    }
                });
            });
    }

    function filterStoriesByStatus(jiraQueryResults) {
        // console.log('filtering results by status...', jiraQueryResults);

        return request.get(JIRA_URL + 'issue/' + jiraQueryResults[0].id + '/transitions?expand=transitions.fields', jiraApiOptions)
            .then(function (data) {
                transitions = _.map(data.transitions, function (item) {
                    return {
                        id: item.id,
                        name: item.name,
                        nextTransition: {
                            id: item.to.id,
                            name: item.to.name
                        }
                    };
                });
                return data;
            })
            .then(function (data) {
                var results = _.filter(jiraQueryResults, function (item) {
                    return _.includes(['In Progress', 'Done'], item.status.name);
                });
                return results;
            });
    }

    function getStoryDevStatus(story) {
        // console.log('getting story dev status...');
        var url = JIRA_DEV_STATUS_URL
            .replace('{issueId}', story.id)
            .replace('{dataType}', releaseOptions.searchRepoDataType)
            .replace('{repoType}', releaseOptions.repository);

        return request.get(url, jiraApiOptions)
            .then(function (data) {
                story.branches = data.detail[0].branches;
                story.pullRequests = data.detail[0].pullRequests;

                return story;
            });
    }

    function createVersion(releaseName, project) {
        // console.log('creating release...');
        var date = new Date();
        return request.post(JIRA_URL + 'version', {
            headers: jiraApiOptions.headers,
            json: true,
            body: {
                description: "An excellent version",
                name: releaseName,
                archived: false,
                released: false,
                releaseDate: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
                // userReleaseDate: "6/Jul/2010",
                project: project.name,
                projectId: project.id
            }
        });
    }

    function updateVersion(releaseData) {
        // console.log('do transition for release...');
        return request.put(JIRA_URL + 'version/' + releaseData.id, _.merge({
            body: {
                released: true
            }
        }, jiraApiOptions))
            .then(function (data) {
                // console.log('Successfully released version ' + releaseData.name);
                return data;
            });
    }

    function doTransition(story) {
        return request.get(JIRA_URL + 'issue/' + story.id + '/transitions', jiraApiOptions)
            .then(function (data) {
                var transition = _.find(data.transitions, function (item) {
                    return item.name === releaseOptions.issueReleasedStatus;
                });

                if (!transition) {
                    throw new Error('Can\'t execute transition to not-existing status.');
                }

                var requestOptions = _.merge({
                    body: {
                        transition: {
                            id: transition.id
                        }
                    }
                }, jiraApiOptions);

                // console.log('Story Update Request Options:', JSON.stringify(requestOptions));

                return request.post(JIRA_URL + 'issue/' + story.id + '/transitions?expand=transitions.update', requestOptions)
                    .then(function (results) {
                        // console.log('Story ' + story.key + ' successfully transitioned to ' + releaseOptions.issueReleasedStatus);
                        return results;
                    });
            });
    }

    function updateStory(story, releaseData) {
        // transition to Done status
        var requestOptions = _.merge({
            body: {
                fields: {
                    fixVersions: [{
                        id: releaseData.id
                    }],
                    description: (story.description || '') + '\nReleased at ' + releaseData.name
                }
            },
        }, jiraApiOptions);

        // console.log('Story Update Request Options:', JSON.stringify(requestOptions));

        return request.put(JIRA_URL + 'issue/' + story.id, requestOptions)
            .then(function (results) {
                // console.log('Successfully updated fixVersions');
                return results;
            });
    }

    return authenticateAndInitializeOptions()
        .then(function (authOptions) {
            jiraApiOptions = authOptions;

            return findUser(buildUserData)
                .then(function (user) {
                    return findStories(user);
                })
                .then(function (results) {
                    return filterStoriesByStatus(results)
                        .each(getStoryDevStatus);
                })
                .each(getStoryDevStatus)
                .then(function (stories) {
                    var releaseStories = _.filter(stories, function (item) {
                        var validBranches = _.filter(item.branches, function (itemBranch) {
                            return itemBranch.name.indexOf(branch) > -1;
                        });
                        return validBranches.length > 0;
                    });
                    return createVersion(releaseName, releaseStories[0].project)
                        .then(function (releaseData) {
                            var promises = _.concat(
                                _.map(releaseStories, function (story) {
                                    return updateStory(story, releaseData);
                                }),
                                _.map(releaseStories, function(story) {
                                    return doTransition(story, releaseData);
                                })
                            );

                            return Promise.all(promises)
                                .then(function () {
                                    return updateVersion(releaseData);
                                });
                        })
                        .then(function () {
                            return releaseStories;
                        });
                });
        });
}

module.exports = {
    release: release
}