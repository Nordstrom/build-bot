const Botkit = require('botkit')
const shellbot = require('botkit-shell')
const Promise = require('bluebird')

class BuildBot {

  constructor(botFactory, options) {
    this.options = options
    this.controller = botFactory({});
  }

  start(spawnFunc){
    this.bot = spawnFunc.call(this, spawnFunc);
  }

  init(abilities) {
    promisify(this.controller, this.bot)

    if (typeof abilities === 'function') {
      abilities(this.controller, this.bot)
    } else {
      this.bot.botkit.log('Did not add abilities to bot')
    }

  }

  static startSlack(){
    if (!process.env.BOT_TOKEN) {
      throw new Error('Error: Specify token in environment')
    }

    var bot = new BuildBot(Botkit.slackbot, { token: process.env.BOT_TOKEN })
    bot.start(function spawnSlack(){
      return this.controller.spawn(this.options).startRTM()
    })
    return bot

  }

  static startShell(){
    var bot = new BuildBot(shellbot, {})
    bot.start(function spawnShell(){
      return this.controller.spawn(this.options)
    })
    return bot
  }

}

function promisify(controller, bot){

  Promise.promisifyAll(controller, {
      filter: function(name) {
        return name === 'hears';
      },
      promisifier: function(originalMethod) {
        return function promisified(keywords, events, middleware){
          return new Promise(function(resolve, reject){
              function callback(bot, message){
                resolve({ bot, message });
              }
              if (middleware){
                originalMethod(keywords, events, middleware, callback)
              } else {
                originalMethod(keywords, events, callback)
              }
          });
        }
      }
    })

    Promise.promisifyAll(controller)
    Promise.promisifyAll(bot)


}

module.exports = BuildBot