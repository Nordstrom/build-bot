var Botkit = require('botkit')
var os = require('os')
var shellbot = require('botkit-shell')

class SlackBot {

  constructor(token) {
    this.token = token
    this.controller = Botkit.slackbot({
      // debug: true
    })
  }

  start() {
    this.bot = this.controller.spawn({
      token: this.token
    }).startRTM()
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
    this.controller = shellbot({})
  }

  start(){
    this.bot = this.controller.spawn({})
  }

}


module.exports = { SlackBot, ShellBot }