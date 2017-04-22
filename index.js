var SlackBot = require('./src/bot').SlackBot
var ShellBot = require('./src/bot').ShellBot

var bot;
try {

  if (process.env.BOT_ADAPTER === 'slack') {
    bot = SlackBot.create()
  } else {
    bot = new ShellBot()
  }

  bot.start( require('./src/bot/abilities') )

} catch(err){
  console.error('There was an error creating a bot instance', err)
  process.exit(1)

}

module.exports = bot
