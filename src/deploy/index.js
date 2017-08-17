
class TagDeployment {

	constructor(bitbucket, deploymentBranch) {
		this.bitbucket = bitbucket
		this.deploymentBranch = deploymentBranch
	}

	exists(projectKey, repoName) {
		return this.bitbucket.repos.getRepo(projectKey, repoName)
	}

	startDeployment(projectKey, repoName){
		this.bitbucket.tags.post(projectKey, repoName, null, this.deploymentBranch)
	}

}


module.exports = { Deployer: TagDeployment }