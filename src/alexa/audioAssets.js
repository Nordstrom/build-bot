'use strict';

// Audio Source - AWS Podcast : https://aws.amazon.com/podcasts/aws-podcast/
var waitingThemeUrl = 'https://s3.amazonaws.com/halbot-hack-resources/sound/waiting-theme.mp3';
var waitingThemeUrl2 = 'https://s3.amazonaws.com/halbot-hack-resources/sound/alarm.mp3';
var waitingAudio = {
    'title' : 'Waiting for Build',
    'url' : waitingThemeUrl2
};

var audioData = [
    waitingAudio,
    waitingAudio,
    waitingAudio,
    waitingAudio,
    waitingAudio
];

module.exports = audioData;