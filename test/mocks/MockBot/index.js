var Botkit = require('botkit').core
var readline = require('readline')
var {PassThrough} = require('stream')
var Promise = require('bluebird')

function MockBot(configuration, inStream, outStream) {

        // Create a core botkit bot
        var mockBot = Botkit(configuration || {});

        mockBot.middleware.spawn.use(function(bot, next) {

            mockBot.startTicking()
            mockBot.rl = readline.createInterface({ input: inStream, output: outStream, terminal: false });
            mockBot.rl.on('line', function(line) {
                var message = {
                    text: line,
                    user: 'user',
                    channel: 'text',
                    timestamp: Date.now()
                };

                mockBot.receiveMessage(bot, message);   
            });
            next();

        });

        mockBot.defineBot(function(botkit, config) {

            var bot = {
                botkit: botkit,
                config: config || {},
                utterances: botkit.utterances,
            };

            bot.createConversation = function(message, cb) {
                botkit.createConversation(this, message, cb);
            };

            bot.startConversation = function(message, cb) {
                botkit.startConversation(this, message, cb);
            };

            bot.send = function(message, cb) {
                outStream.write(message.text)
                if (cb) {
                    cb();
                }
            };

            bot.reply = function(src, resp, cb) {
                var msg = {};

                if (typeof(resp) == 'string') {
                    msg.text = resp;
                } else {
                    msg = resp;
                }

                msg.channel = src.channel;

                bot.say(msg, cb);
            };

            bot.findConversation = function(message, cb) {
                botkit.debug('CUSTOM FIND CONVO', message.user, message.channel);
                for (var t = 0; t < botkit.tasks.length; t++) {
                    for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                        if (
                            botkit.tasks[t].convos[c].isActive() &&
                            botkit.tasks[t].convos[c].source_message.user == message.user
                        ) {
                            botkit.debug('FOUND EXISTING CONVO!');
                            cb(botkit.tasks[t].convos[c]);
                            return;
                        }
                    }
                }

                cb();
            };

            return bot;

        });

        return mockBot
    
};

class BotKitMock {

    constructor(){
        this.input = new PassThrough()
        this.output = new PassThrough()
        this.controller = MockBot({identity: { id: 'mockbot', name: 'MockBot' }}, this.input, this.output)
        this.bot = this.controller.spawn();

        this.outputPromise = Promise.resolve('')

        this.output.on('data', chunk => {
            this.outputPromise = Promise.resolve(chunk.toString())
        })
    }

    write(str){
        this.input.write(str + '\n')
    }

    getOutput() {
        return this.outputPromise
    }

    shutdown() {
        this.bot.botkit.shutdown()
    }

}

module.exports = BotKitMock
