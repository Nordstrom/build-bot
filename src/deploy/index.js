
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
		this.controller.log('constructing deploy conversation')
	}

	reply(bot, message) {
		this.controller.log('replying...')
	    bot.bot.reply(bot.message, "I'm sorry, I don't know how to do deployments yet.")
	}

	init() {
		this.controller.log('deploy conversation init')
		this.controller.hearsAsync(['deploy'], 'message_received,direct_message,direct_mention,mention').then((bot, message) => {
			this.reply(bot, message)
		})
	}

}


module.exports = { Deployer: TagDeployment, Conversation }