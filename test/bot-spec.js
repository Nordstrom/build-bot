var BotSpec = module.exports = describe('Bot tests', function(){

	var BuildBot = require('../src/bot');

	describe('promisification', function(){


		var botKitBot = {
					myFunc: function(){

					}

				};
		var botKitController = {
				hears: function(){

				},
				otherFunc: function(){

				}
			};
		var botFactory = function(){
			return botKitController;
		};

		var bot

		before(function(){
			bot = new BuildBot(botFactory)
			bot.start(function spawn(){
				return botKitBot
			 })
			bot.init(function abilities(){ })
		})

		it('should create async versions of each function in the instance spawned by the bot controller', function(){
			expect(botKitBot).to.have.property("myFuncAsync");
		})
		it('should create async version of each function in the instance created by the bot factory', function(){
			expect(botKitController).to.have.property('hearsAsync')
			expect(botKitController).to.have.property('otherFuncAsync')
		})

	})

});