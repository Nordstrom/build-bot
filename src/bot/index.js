const Botkit = require('botkit')
const shellbot = require('botkit-shell')
const Promise = require('bluebird')

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

    promisify(this.controller, this.bot)

    if (typeof abilities === 'function') {
      abilities(this.controller, this.bot)
    } else {
      this.bot.botkit.log('Did not add abilities to bot')
    }

  }

  static create(){
    if (!process.env.BOT_TOKEN) {
      throw new Error('Error: Specify token in environment')
    }

    return new SlackBot(process.env.BOT_TOKEN);

  }

}

class ShellBot {

  constructor(){
    this.controller = shellbot({})
  }

  start(abilities){
    this.bot = this.controller.spawn({})

    promisify(this.controller, this.bot)

    if (typeof abilities === 'function') {
      abilities(this.controller, this.bot)
    } else {
      this.bot.botkit.log('Did not add abilities to bot')
    }

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
                resolve(message);
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

module.exports = { SlackBot, ShellBot }