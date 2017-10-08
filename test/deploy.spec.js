describe('Deploy', () => {
  const BotKitMock = require('./mocks/MockBot')
  const {Deployer, Conversation} = require(SRC_HOME + '/deploy')
  const {Client} = require('bitbucket-server-nodejs')

  const bitbucketBaseUrl = 'http://bitbuckethost:1234'
  const bitbucketBaseApiUrl = `${bitbucketBaseUrl}/rest/api/1.0`
  const projectKey = 'myProject'
  const repoName = 'myRepo'
  const deploymentBranch = 'myDeployBranch'
  const bitbucketRepoPath = `/projects/${projectKey}/repos/${repoName}`

  let deployer
  let bitbucketClient

  before(() => {
    bitbucketClient = new Client(bitbucketBaseApiUrl)
    deployer = new Deployer(bitbucketClient, deploymentBranch)
  })

  describe('GIVEN repo name is undefined', () => {
    it('WHEN checking if repo exists THEN should reject', () => {
      return expect(deployer.exists()).to.be.rejected
    })
  })

  describe('GIVEN repo name', () => {
    describe('AND repo exists', () => {
      let scope

      beforeEach(() => {
        scope = nock(bitbucketBaseApiUrl)
                    .get(bitbucketRepoPath)
                    .reply(200)
      })
      afterEach(() => {
        expect(scope.isDone()).to.be.true
      })

      describe('WHEN checking if repo exists', () => {
        it('THEN should check bitbucket server for repo existence', () => {
          return expect(deployer.exists(projectKey, repoName)).to.be.fulfilled
        })
      })

      describe('WHEN starting deployment', () => {
        let createTagSpy
        let startDeployment

        before(() => {
          createTagSpy = sinon.spy(bitbucketClient.tags, 'post')
          startDeployment = deployer.startDeployment.bind(deployer, projectKey, repoName)
        })
        after(() => {
          bitbucketClient.tags.post.restore()
        })

        it('THEN should create remote bitbucket tag', () => {
          startDeployment()
          expect(createTagSpy).to.have.been.calledWith(projectKey, repoName, null, deploymentBranch)
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
          return expect(deployer.exists(projectKey, repoName)).to.be.rejected
        })
      })
    })
  })

  describe('GIVEN controller is listening for deploy direct messages', () => {
    let mock
    let conversation

    before(() => {
      mock = new BotKitMock()
      conversation = new Conversation(mock.controller)
      conversation.init()
      
    })
    after(() => {
      mock.shutdown()
    })

    describe('WHEN direct message contains only text: deploy', () => {
      
      before(() => {
        mock.write('deploy')
      })

      it('THEN should respond with message saying it doesn`t know what to deploy', () => {
        return mock.getOutput().then(reply => {
          expect(reply).to.equal("I'm sorry, I don't know how to do deployments yet.")
        })
      })

      describe('AND another direct message contains only text: deploy', () => {

        before( () => mock.write('deploy') )

        it('THEN should respond with message saying it doesn`t know what to deploy', () => {
          return mock.getOutput().then(reply => {
            expect(reply).to.equal("I'm sorry, I don't know how to do deployments yet.")
          })
        })

      })

    })

  })

})
