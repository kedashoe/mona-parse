/* global describe, it */
var assert = require('assert')
var parse = require('..').parse
var core = require('@mona/core')

describe('mona.parse()', function () {
  it('executes a parser on some input and returns the result', function (d) {
    var result = {}
    parse(core.value(result), '').then(function (res) {
      assert.equal(res, result)
      d()
    }, d)
  })
  it('returns ParserState on success if returnState is true', function (d) {
    parse(core.value('foo'), '', {returnState: true}).then(function (res) {
      assert.equal(res.value, 'foo')
      assert.ok(res.isParserState)
      d()
    }, d)
  })
  it('Fails the promise on parse failure by default', function (d) {
    parse(core.fail('bad qq'), '').then(d, function (e) {
      assert.equal('(line 1, column 0) bad qq', e.message)
      d()
    })
  })
  it('reports an error if parser argument isn\'t a function', function (d) {
    parse(undefined, 'parsemeplease').then(d, function (e) {
      assert.equal(
        e.message,
        'Parser needs to be a function, but got undefined instead')
      d()
    })
  })
})
