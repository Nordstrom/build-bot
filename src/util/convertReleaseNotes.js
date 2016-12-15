'use strict'

var _ = require('lodash');

function translateNote(item) {
    var translated = '';
    if (item.title){
        translated += '### ' + item.title;
    }
    if (item.summary) {
        translated += '\n' + item.summary + '\n';
    }
    return translated;
}

module.exports = function(notes) {

    var formatted =[];
    if (!_.isArray(notes)) {
        notes = [notes];
    }
     _.forEach(notes, function(item){
       formatted.push(translateNote(item));
    });

    return formatted;
};