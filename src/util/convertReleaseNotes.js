'use strict'

var _ = require('lodash')

function translateNote (item) {
  var translated = ''
  if (item.summary) {
    translated += '### ' + item.summary
  }
  if (item.description) {
    translated += '\n' + item.description + '\n'
  }
  return translated
}

module.exports = function (notes) {
  var formatted = ''
  if (!_.isArray(notes)) {
    notes = [notes]
  }
  _.forEach(notes, function (item) {
    formatted += translateNote(item) + '\n'
  })

  return formatted
}
