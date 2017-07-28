
class TagDeployment {

	constructor(bitbucket, projectKey) {
		this.bitbucket = bitbucket
		this.projectKey = projectKey
	}

	exists(repoName) {
		return this.bitbucket.repos.getRepo(this.projectKey, repoName)
	}

}


module.exports = { Deployer: TagDeployment }