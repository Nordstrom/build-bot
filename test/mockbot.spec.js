describe('mock bot', () => {
	const BotKitMock = require('./mocks/MockBot')
	const replyText = 'Hey there'
	const callText = 'hi'
	let mock

	before(() => {
		mock = new BotKitMock()

		mock.controller.hears([callText], 'message_received', function(bot, message) {
		    bot.reply(message, replyText);
		});

	})
	after(() => {
		mock.shutdown()
	})

	it('should get a reply', () => {
		mock.write(callText)
		return mock.getOutput().then(reply => {
			expect(reply).to.equal(replyText)
		})
	})


})