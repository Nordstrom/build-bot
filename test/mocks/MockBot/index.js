var Botkit = require('botkit').core
var readline = require('readline')
var streamBuffers = require('stream-buffers')
var Duplex = require('stream').Duplex;

function MockBot(configuration, inStream, outStream) {

    // Create a core botkit bot
    var mockBot = Botkit(configuration || {});

    mockBot.middleware.spawn.use(function(bot, next) {
        mockBot.listenStdIn(bot);
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
            console.log('BOT:', message.text);
            if (cb) {
                cb();
            }
        };

        bot.reply = function(src, resp, cb) {
            bot.botkit.log('replying')
            var msg = {};

            if (typeof(resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            botkit.log(src)

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

    mockBot.listenStdIn = function(bot) {

        mockBot.startTicking();
        var rl = readline.createInterface({ input: inStream, output: outStream, terminal: false });
        rl.on('line', function(line) {
            var message = {
                text: line,
                user: 'user',
                channel: 'text',
                timestamp: Date.now()
            };
            mockBot.receiveMessage(bot, message);
        });
    };

    return mockBot;
};

class MyDuplex extends Duplex {
  constructor(options, writableStream, readableStream) {
    super(options);
    this.writableStream = writableStream
    this.readableStream = readableStream
  }

  _write(chunk, encoding, callback) {
    this.writableStream._write(chunk, encoding, callback)
  }

  _read(size) {
    this.readableStream._read(size)
  }
}

var convoIn = new streamBuffers.ReadableStreamBuffer()
var convoOut = new streamBuffers.WritableStreamBuffer()

var controller = MockBot({identity: { id: 'mockbot', name: 'MockBot' }}, convoIn, outStream);
var bot = controller.spawn();

controller.hears(['hello', 'hi'], 'message_received', function(bot, message) {
    bot.reply(message, 'Hey there buddy');

});

convoOut.on('finish', function(data){
     var chunk;
    while((chunk = readableStream.read()) !== null) {
        console.dir(chunk)
    }

})

console.log('writing')
convoIn.put('hi\n')









