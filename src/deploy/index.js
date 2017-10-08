
class TagDeployment {

	constructor(bitbucket, deploymentBranch) {
		this.bitbucket = bitbucket
		this.deploymentBranch = deploymentBranch
	}

	exists(projectKey, repoName) {
		return this.bitbucket.repos.getRepo(projectKey, repoName)
	}

	startDeployment(projectKey, repoName){
		if (this.exists(projectKey, repoName)) {
			this.bitbucket.tags.post(projectKey, repoName, null, this.deploymentBranch)
		}
	}

}

class Conversation {

	constructor(controller) {
		this.controller = controller
	}

	reply(bot, message) {
	    bot.reply(message, "I'm sorry, I don't know how to do deployments yet.")
	}

	init() {
		this.controller.hears(['deploy'], 'direct_message,direct_mention,mention', (bot, message) => {
			this.reply(bot, message)
		})
	}

}


module.exports = { Deployer: TagDeployment, Conversation }