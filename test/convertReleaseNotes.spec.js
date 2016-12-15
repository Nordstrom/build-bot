'use strict'

var convertReleaseNotes = require('../src/util/convertReleaseNotes.js');

describe('Test release notes converter', function(){

    it('multi release notes', function(){
        var notes = convertReleaseNotes([
            {
                title: 'title1',
            summary: 'Jira Summary1'
            },
            {
                title: 'title2',
                summary: 'Jira Summary2'
            },
        ]);
        console.log(notes);
    });

    it('single release notes', function(){
        var notes = convertReleaseNotes(
            {
                title: 'title1',
                summary: 'Jira Summary1'
            });
        console.log(notes);
    });
})
