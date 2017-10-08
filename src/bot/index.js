const Botkit = require('botkit')
const shellbot = require('botkit-shell')

class BuildBot {

  constructor(botFactory, options) {
    this.options = options
    this.controller = botFactory({});
  }

  start(spawnFunc){
    this.bot = spawnFunc.call(this, spawnFunc);
  }

  init(abilities) {

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

module.exports = BuildBot