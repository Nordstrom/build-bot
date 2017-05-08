var BuildBot = require('./src/bot')

var bot;
try {

  if (process.env.BOT_ADAPTER === 'slack') {
    bot = BuildBot.startSlack()
  } else {
    bot = BuildBot.startShell()
  }

  bot.init( require('./src/bot/abilities') )

} catch(err){
  console.error('There was an error creating a bot instance', err)
  process.exit(1)

}

module.exports = bot
