/* global describe, it */
var assert = require('assert')
var mona = require('..')
var parse = mona.parse

describe('mona.parse()', function () {
  it('executes a parser on some input and returns the result', function (d) {
    var result = {}
    parse(mona.value(result), '').then(function (res) {
      assert.equal(res, result)
      d()
    }, d)
  })
  it('returns ParserState on success if returnState is true', function (d) {
    parse(mona.value('foo'), '', {returnState: true}).then(function (res) {
      assert.equal(res.value, 'foo')
      assert.ok(res.isParserState)
      d()
    }, d)
  })
  it('Fails the promise on parse failure by default', function (d) {
    parse(mona.fail('bad qq'), '').then(function (res) {
      assert.fail('promise failure', 'promise succeeded with, ' + res)
    }, function (e) {
      assert.equal('(line 1, column 1) bad qq', e.message)
    })
  })
  it('reports a nice error if parser argument isn\'t a function', function () {
    parse(undefined, 'parsemeplease').then(function (res) {
      assert.fail('promise failure', 'promise succeeded with, ' + res)
    }), function (e) {
      assert.equal(
        e.message,
        'Parser needs to be a function, but got undefined instead')
    }
  })
})
