describe('Deploy', () => {

    const {Deployer} = require(SRC_HOME + '/deploy')
    const {Client} = require('bitbucket-server-nodejs')

    const bitbucketBaseUrl = 'http://bitbuckethost:1234'
    const bitbucketBaseApiUrl = `${bitbucketBaseUrl}/rest/api/1.0`
    const projectKey = 'myProject'
    const repoName = 'myRepo'
    const bitbucketRepoPath = `/projects/${projectKey}/repos/${repoName}`

    let deployer
    let bitbucketClient

    before(() => {
        bitbucketClient = new Client(bitbucketBaseApiUrl)
        deployer = new Deployer(bitbucketClient, projectKey)
    })
    after(() => {
        expect(nock.isDone()).to.be.true

    })

    describe('GIVEN repo name is undefined', () => {

        it('WHEN checking if repo exists THEN should reject', () => {
            return expect(deployer.exists()).to.be.rejected

        })
    })

    describe('GIVEN repo name', () => {

        describe('AND repo exists', () => {
            let scope

            before(() => {
                scope = nock(bitbucketBaseApiUrl)
                    .get(bitbucketRepoPath)
                    .reply(200)
            })
            after(() => {
                expect(scope.isDone()).to.be.true
            })

            describe('WHEN checking if repo exists', () => {            
            
                it('THEN should check bitbucket server for repo existence', () => {
                    return expect( deployer.exists(repoName) ).to.be.fulfilled
                })    

            })

        })

        describe('AND repo does not exist', () => {
            let scope

            before(() => {
                scope = nock(bitbucketBaseApiUrl)
                    .get(bitbucketRepoPath)
                    .reply(404)
            })
            after(() => {
                expect(scope.isDone()).to.be.true
            })

            describe('WHEN checking if repo exists', () => {

                it('THEN should reject', () => {
                    return expect( deployer.exists(repoName) ).to.be.rejected
                })
            })

        })

    
    })


})