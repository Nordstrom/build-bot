class TagDeployment {




}

class DeployConversation {



	listen(controller, bot){

		/*controller.hearsAsync(['deploy'], 'direct_message,direct_mention,mention', function (bot, message) {
		    console.log(JSON.stringify(message))
		    const match = message.text.match(/deploy\s([a-zA-Z0-9-_/]+)\s([a-zA-Z0-9-_/]+)(\s([a-zA-Z0-9-_/]+))?/)
		    console.log(match)
		    let bld = {
		      repo: match[1],
		      branch: match[2],
		      release: match[4]
		    }
		});*/

	}


}

module.exports = { Conversation: DeployConversation }