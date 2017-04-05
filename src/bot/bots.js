var Botkit = require('botkit')
var shellbot = require('botkit-shell')

class SlackBot {

  constructor(token) {
    this.token = token
    this.controller = Botkit.slackbot({
      // debug: true
    })
  }

  start(abilities) {
    this.bot = this.controller.spawn({
      token: this.token
    }).startRTM()

    if (typeof abilities === 'function') {
      abilities(this.controller, this.bot)
    } else {
      this.bot.botkit.log('Did not add abilities to bot')
    }

  }

  static create(){
    if (!process.env.token) {
      throw new Error('Error: Specify token in environment')
    }
    return new SlackBot(process.env.token);

  }

}

class ShellBot {

  constructor(){
    this.controller = shellbot({

    })
  }

  start(abilities){
    this.bot = this.controller.spawn({})

    if (typeof abilities === 'function') {
      abilities(this.controller, this.bot)
    } else {
      this.bot.botkit.log('Did not add abilities to bot')
    }

  }

}


module.exports = { SlackBot, ShellBot }