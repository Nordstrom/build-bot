var SlackBot = require('./bots').SlackBot
var ShellBot = require('./bots').ShellBot

var bot;
try {

  if (process.env.BOT_ADAPTER === 'slack') {
    bot = SlackBot.create()
  } else {
    bot = new ShellBot()
  }

  bot.start(require('./abilities'))

} catch(err){
  console.error('There was an error creating a bot instance', err)
  process.exit(1)

}
