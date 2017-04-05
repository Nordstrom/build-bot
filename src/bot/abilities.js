const ctrl = require('../ctrl.js')
const os = require('os')

function abilities(controller, bot) {

  helloAbility(controller, bot)
  identityAbility(controller, bot)
  shutdownAbility(controller, bot)

}

function deployAbilities(controller, bot) {
  controller.hears(['deploy'], 'direct_message,direct_mention,mention', function (bot, message) {
    console.log(JSON.stringify(message))
    const match = message.text.match(/deploy\s([a-zA-Z0-9-_/]+)\s([a-zA-Z0-9-_/]+)(\s([a-zA-Z0-9-_/]+))?/)
    console.log(match)
    let bld = {
      repo: match[1],
      branch: match[2],
      release: match[4]
    }

    ctrl.detectVersion(bld)
        .then(version => {
          bld.version = version

          const msgPostfix = 'you sure you want to deploy repo *' + bld.repo + '* branch *' + bld.branch + '* version *' + bld.version + '*?'

          controller.storage.users.get(message.user, function (err, user) {
            const msg = (user && user.name)
              ? user.name + ', are ' + msgPostfix
              : 'Are ' + msgPostfix

            bot.startConversation(message, function (err, convo) {
              if (err) return
              convo.ask(msg, [
                {
                  pattern: /(yes|y|uhuh|ya|yup|da|haan|qui|si|shi)/,
                  callback: function (response, convo) {
                                          // since no further messages are queued after this,
                                          // the conversation will end naturally with status == 'completed'
                    convo.next()
                  }
                },
                {
                  pattern: 'no',
                  callback: function (response, convo) {
                                          // stop the conversation. this will cause it to end with status == 'stopped'
                    convo.stop()
                  }
                },
                {
                  default: true,
                  callback: function (response, convo) {
                    convo.repeat()
                    convo.next()
                  }
                }
              ])

              convo.on('end', function (convo) {
                if (convo.status === 'completed') {
                  ctrl.deploy(bld)
                    .then(() => {
                      bot.reply(message, 'OK! I am kicking off the deploy now...')
                      ctrl.monitor(bld, {
                        start: () => {
                          bot.reply(message, 'Great! Your deploy has *STARTED*...')
                        },
                        finish: () => {
                          bot.reply(message, 'YAY! Your deploy has *FINISHED* successfully... Test it out and then commit...  `Number 5 is ALIVE!`')
                        },
                        fail: () => {
                          bot.reply(message, 'OH NO! You deploy *FAILED*!! Go to check it out!!  `No Disassemble, No Disassemble!`')
                        }
                      })
                    })
                    .catch(err => {
                      bot.api.reactions.add({
                        timestamp: message.ts,
                        channel: message.channel,
                        name: 'robot_face'
                      }, function (err, res) {
                        if (err) {
                          bot.botkit.log('Failed to add emoji reaction :(', err)
                        }
                      })
                      bot.reply(message, `OOPS! Looks like someone's already running a deploy!  You'll need to wait til they're done!`)
                    })
                } else {
                                  // this happens if the conversation ended prematurely for some reason
                  bot.reply(message, 'OK, nevermind!')
                }
              })
            })
          })
        })
    })

  controller.hears(['commit'], 'direct_message,direct_mention,mention', function (bot, message) {
      console.log(JSON.stringify(message))
      const match = message.text.match(/commit\s([a-zA-Z0-9-_/]+)/)
      console.log(match)
      let bld = {
        repo: match[1]
      }
      const msgPostfix = 'you sure you want to commit your deploy of repo *' + bld.repo + '*?'

      controller.storage.users.get(message.user, function (err, user) {
        const msg = (user && user.name)
              ? user.name + ', are ' + msgPostfix
              : 'Are ' + msgPostfix

        bot.startConversation(message, function (err, convo) {
          if (err) return
          convo.ask(msg, [
            {
              pattern: /(yes|y|uhuh|ya|yup|da|haan|qui|si|shi)/,
              callback: function (response, convo) {
                                          // since no further messages are queued after this,
                                          // the conversation will end naturally with status == 'completed'
                convo.next()
              }
            },
            {
              pattern: 'no',
              callback: function (response, convo) {
                                          // stop the conversation. this will cause it to end with status == 'stopped'
                convo.stop()
              }
            },
            {
              default: true,
              callback: function (response, convo) {
                convo.repeat()
                convo.next()
              }
            }
          ])

          convo.on('end', function (convo) {
            if (convo.status === 'completed') {
              bot.reply(message, 'OK! I am committing the deploy now...')
              bld.email = user.email
              ctrl.commit(bld, {
                committed: () => {
                  bot.reply(message, `Excellent! Your deploy has been *COMMITTED*!
    - The branch was merged to master and tagged
    - Your stories have been marked released
    - Artifacts have been saved
                  `)
                },
                finish: () => {
                  bot.reply(message, 'YAY! Your deploy has *FINISHED* successfully... Test it out and then commit...  `Number 5 is ALIVE!`')
                },
                failed: () => {
                  bot.reply(message, 'OH NO! Your commit *FAILED*!! Go to check it out!!  `No Disassemble, No Disassemble!`')
                }
              })
            } else {
                                  // this happens if the conversation ended prematurely for some reason
              bot.reply(message, 'OK, nevermind!  To rollback the deploy tell me to rollback...')
            }
          })
        })
      })
    })
}

function helloAbility(controller, bot){
  controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function (bot, message) {
    if (bot.api && bot.api.reactions) {
      bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face'
      }, function (err, res) {
        bot.botkit.log('doing something')
        if (err) {
          bot.botkit.log('Failed to add emoji reaction :(', err)
        }
      })
    }

      controller.storage.users.get(message.user, function (err, user) {
        if (err) {
          console.error('Some error', err)
        }
        if (user && user.name) {
          bot.reply(message, 'Hello ' + user.name + '!!')
        } else {
          bot.reply(message, 'Hello.')
        }
      })
    })
}

function userAbilities(controller, bot){
  controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function (bot, message) {
      var name = message.match[1]
      controller.storage.users.get(message.user, function (err, user) {
        if (!user) {
          user = {
            id: message.user
          }
        }
        user.name = name
        controller.storage.users.save(user, function (err, id) {
          bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.')
        })
      })
    })

    controller.hears(['my email is (.*)'], 'direct_message,direct_mention,mention', function (bot, message) {
      var email = message.match[1]
      email = email.match(/\<mailto\:([a-zA-Z0-9\@\-_\.]+)\|/)[1]
      controller.storage.users.get(message.user, function (err, user) {
        if (!user) {
          user = {
            id: message.user
          }
        }
        console.log('email', email)
        user.email = email
        controller.storage.users.save(user, function (err, id) {
          console.log('user.email', user.email)
          bot.reply(message, 'Got it. Your email is ' + user.email + '.')
        })
      })
    })

    controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function (bot, message) {
      controller.storage.users.get(message.user, function (err, user) {
        if (user && user.name) {
          bot.reply(message, 'Your name is ' + user.name)
        } else {
          bot.startConversation(message, function (err, convo) {
            if (!err) {
              convo.say('I do not know your name yet!')
              convo.ask('What should I call you?', function (response, convo) {
                convo.ask('You want me to call you `' + response.text + '`?', [
                  {
                    pattern: 'yes',
                    callback: function (response, convo) {
                                        // since no further messages are queued after this,
                                        // the conversation will end naturally with status == 'completed'
                      convo.next()
                    }
                  },
                  {
                    pattern: 'no',
                    callback: function (response, convo) {
                                        // stop the conversation. this will cause it to end with status == 'stopped'
                      convo.stop()
                    }
                  },
                  {
                    default: true,
                    callback: function (response, convo) {
                      convo.repeat()
                      convo.next()
                    }
                  }
                ])

                convo.next()
              }, {'key': 'nickname'}) // store the results in a field called nickname

              convo.on('end', function (convo) {
                if (convo.status === 'completed') {
                  bot.reply(message, 'OK! I will update my dossier...')

                  controller.storage.users.get(message.user, function (err, user) {
                    if (!user) {
                      user = {
                        id: message.user
                      }
                    }
                    user.name = convo.extractResponse('nickname')
                    controller.storage.users.save(user, function (err, id) {
                      bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.')
                    })
                  })
                } else {
                                // this happens if the conversation ended prematurely for some reason
                  bot.reply(message, 'OK, nevermind!')
                }
              })
            }
          })
        }
      })
    })
}

function shutdownAbility(controller, bot){
  controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function (bot, message) {
    bot.startConversation(message, function (err, convo) {
      convo.ask('Are you sure you want me to shutdown?', [
        {
          pattern: bot.utterances.yes,
          callback: function (response, convo) {
            convo.say('Bye!')
            convo.next()
            setTimeout(function () {
              process.exit()
            }, 3000)
          }
        },
        {
          pattern: bot.utterances.no,
          default: true,
          callback: function (response, convo) {
            convo.say('*Phew!*')
            convo.next()
          }
        }
      ])
    })
  })

}

function identityAbility(controller, bot){
  controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
      'direct_message,direct_mention,mention', function (bot, message) {
        var hostname = os.hostname()
        var uptime = formatUptime(process.uptime())

        bot.reply(message,
              ':robot_face: I am a bot named <@' + bot.identity.name +
               '>. I have been running for ' + uptime + ' on ' + hostname + '.')
      })
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