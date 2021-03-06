'use strict';

var Alexa = require('alexa-sdk');
var audioData = require('./audioAssets');
var constants = require('./constants');
var statemgr = require('../models/state').table;

// Binding audio handlers to PLAY_MODE State since they are expected only in this mode.
var audioEventHandlers = Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
    'PlaybackStarted' : function () {
        /*
         * AudioPlayer.PlaybackStarted Directive received.
         * Confirming that requested audio file began playing.
         * Storing details in dynamoDB using attributes.
         */
        this.attributes['token'] = getToken.call(this);
        this.attributes['index'] = getIndex.call(this);
        this.attributes['playbackFinished'] = false;
        this.emit(':saveState', true);
    },
    'PlaybackFinished' : function () {
        /*
         * AudioPlayer.PlaybackFinished Directive received.
         * Confirming that audio file completed playing.
         * Storing details in dynamoDB using attributes.
         */
        this.attributes['playbackFinished'] = true;
        this.attributes['enqueuedToken'] = false;
        this.emit(':saveState', true);
    },
    'PlaybackStopped' : function () {
        /*
         * AudioPlayer.PlaybackStopped Directive received.
         * Confirming that audio file stopped playing.
         * Storing details in dynamoDB using attributes.
         */
        this.attributes['token'] = getToken.call(this);
        this.attributes['index'] = getIndex.call(this);
        this.attributes['offsetInMilliseconds'] = getOffsetInMilliseconds.call(this);
        this.emit(':saveState', true);
    },
    'PlaybackNearlyFinished' : function () {
        /*
         * AudioPlayer.PlaybackNearlyFinished Directive received.
         * Using this opportunity to enqueue the next audio
         * Storing details in dynamoDB using attributes.
         * Enqueuing the next audio file.
         */
        this.attributes['token'] = getToken.call(this);
        var currentToken = this.attributes['token'];
        var enqueuedToken = this.attributes['enqueuedToken'];
        if ((currentToken == '1000') || (enqueuedToken == '1000')) {
            console.log('Completed build song enqueued already!');
            /*
             * Since AudioPlayer.PlaybackNearlyFinished Directive are prone to be delivered multiple times during the
             * same audio being played.
             * If an audio file is already enqueued, exit without enqueuing again.
             */

            return this.context.succeed(true);
        } else {
            var cb = handleDynamoResponse.bind(this);
            return checkBuildComplete(cb);
        }
    },
    'PlaybackFailed' : function () {
        //  AudioPlayer.PlaybackNearlyFinished Directive received. Logging the error.
        console.log("Playback Failed : %j", this.event.request.error);
        this.context.succeed(true);
    }
});

module.exports = audioEventHandlers;

function getToken() {
    // Extracting token received in the request.
    return this.event.request.token;
}

function getIndex() {
    // Extracting index from the token received in the request.
    var tokenValue = parseInt(this.event.request.token);
    return this.attributes['playOrder'].indexOf(tokenValue);
}

function getOffsetInMilliseconds() {
    // Extracting offsetInMilliseconds received in the request.
    return this.event.request.offsetInMilliseconds;
}

function handleDynamoResponse(err, resp){
    var expectedPreviousToken = this.attributes['token'];
    var enqueueIndex = this.attributes['index'];
    enqueueIndex +=1;
    var playBehavior, enqueuedToken, songStreamUrl;

    if (err){
        // error reading from dynamo table
        console.log('Error reading from manager dynamo table!');
        console.log(err);
        return this.context.succeed(true);
    } else {
        var items = resp.Items;
        // check res
        var firstItem = items[0].get();
        if (firstItem.state === 'committed') {
            playBehavior = 'ENQUEUE';
            songStreamUrl = buildCompleteUrl;
            enqueuedToken = 1000;
            this.attributes['enqueuedToken'] = String(enqueuedToken);
            this.attributes['index'] = 1;
        } else {
            playBehavior = 'ENQUEUE';
            enqueueIndex +=1;
            // Checking if  there are any items to be enqueued.
            if (enqueueIndex < 100) {
                // Enqueueing the first item since looping is enabled and build isn't done.
                enqueueIndex = 0;
            }
            // Setting attributes to indicate item is enqueued.
            this.attributes['enqueuedToken'] = String(0);

            enqueuedToken = this.attributes['enqueuedToken'];
            var podcast = audioData[0];
            songStreamUrl = podcast.url;
        }

        this.response.audioPlayerPlay(playBehavior, songStreamUrl, enqueuedToken, expectedPreviousToken, 0);
        this.emit(':responseReady');
    }
}


var buildCompleteUrl = 'https://s3.amazonaws.com/halbot-hack-resources/sound/build-is-done.mp3';

function checkBuildComplete(cb){
    statemgr.query(constants.repoTable.repoName)
        .descending()
        .exec(cb);
}


