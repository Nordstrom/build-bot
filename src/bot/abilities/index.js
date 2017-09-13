const ctrl = require('../../ctrl')
const os = require('os')
const DeployConversation = require('../../deploy').Conversation

function abilities(controller, bot) {

  helloAbility(controller, bot)
  identityAbility(controller, bot)
  shutdownAbility(controller, bot)

  /*const deployConversation = new DeployConversation(controller)
  deployConversation.init()*/
  deployAbility(controller, bot)

}

function deployAbility(controller, bot) {
    controller.hearsAsync(['deploy'], 'direct_message,direct_mention,mention').then((bot, message) => {
      bot.bot.reply(bot.message, "I'm sorry, I don't know how to do deployments yet.")
    })
}

function addReaction(bot, message){
  if (bot.api && bot.api.reactions) {
      bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face'
      }, function (err, res) {
        if (err) {
          bot.botkit.log('Failed to add emoji reaction :(', err)
        }
      })
    }
}

function helloAbility(controller, bot){
  controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {
    replyHello(bot, message);
  })
}

function replyHello(bot, message){
  bot.reply(message, 'Hello.');
}

function replyHelloToUser(controller, bot, message){
  controller.storage.users.get(message.user, function (err, user) {
        if (user && user.name) {
          bot.reply(message, 'Hello ' + user.name + '!!')
        } else {
          replyHello();
        }
      });
}

function shutdown(response, convo){
  convo.say('Bye!')
  convo.next()
  setTimeout(function () {
    process.exit()
  }, 3000)
}

function abortShutdown(response, convo){
    convo.say('*Phew!*')
    convo.next()
}

function shutdownAbility(controller, bot){
  controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function (bot, message) {
    bot.startConversation(message, function(err, convo) { 
      convo.ask('Are you sure you want me to shutdown?', [
        {
          pattern: bot.utterances.yes,
          callback: shutdown
        },
        {
          pattern: bot.utterances.no,
          default: true,
          callback: abortShutdown
        }
      ]);
    })

  })
}

function identityAbility(controller, bot){
  controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
      'direct_message,direct_mention,mention', function(bot, message) {
      var hostname = os.hostname()
      var uptime = formatUptime(process.uptime())

      bot.reply(message,
            ':robot_face: I am a bot named <@' + bot.identity.name +
             '>. I have been running for ' + uptime + ' on ' + hostname + '.')
  });
}


function formatUptime (uptime) {
  var unit = 'second'
  if (uptime > 60) {
    uptime = uptime / 60
    unit = 'minute'
  }
  if (uptime > 60) {
    uptime = uptime / 60
    unit = 'hour'
  }
  if (uptime !== 1) {
    unit = unit + 's'
  }

  uptime = uptime + ' ' + unit
  return uptime
}

module.exports = abilities;