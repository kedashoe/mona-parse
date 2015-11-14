import {eof} from '@mona/core'
import {followedBy} from '@mona/combinators'
import Promise from 'bluebird'
/**
 * Executes a parser and returns the result.
 *
 * @param {Function} parser - The parser to execute.
 * @param {String} string - String to parse.
 * @param {Object} [opts] - Options object.
 * @param {String} [opts.fileName] - filename to use for error messages.
 * @memberof module:mona/api
 * @instance
 *
 * @example
 * parse(token(), 'a') // => 'a'
 */
export async function parse (parser, stream, opts = {}) {
  // TODO - work off streams
  if (!opts.allowTrailing) {
    parser = followedBy(parser, eof())
  }
  let parserState = await invokeParser(
    parser,
    new ParserState(undefined,
                    string,
                    0,
                    opts.userState,
                    opts.position || new SourcePosition(opts.fileName),
                    false))
  if (opts.returnState) {
    return parserState
  } else if (parserState.failed) {
    throw parserState.error
  } else {
    return parserState.value
  }
}

export function value (val) {
  return parserState => {
    let newState = parserState.copy()
    newState.value = val
    return newState
  }
}

export function bind (parser, fun) {
  return async parserState => {
    const newParserState = await invokeParser(parser, parserState)
    if (newParserState.failed) {
      return newParserState
    } else {
      return fun.call(newParserState.userState,
        newParserState.value)(newParserState)
    }
  }
}

export function fail (msg = 'parser error', type = 'failure') {
  return function (parserState) {
    let newParserState = parserState.copy()
    newParserState.failed = true
    var newError = new ParserError(newParserState.position, [msg],
                                   type, type === 'eof')
    newParserState.error = mergeErrors(newParserState.error, newError)
    return newParserState
  }
}

/*
 * Internals
 */
function copy (obj) {
  let newObj = Object.create(Object.getPrototypeOf(obj))
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      newObj[key] = obj[key]
    }
  }
  return newObj
}

export async function invokeParser (parser, parserState) {
  if (typeof parser !== 'function') {
    throw new Error('Parser needs to be a function, but got ' +
                    parser + ' instead')
  }
  if (!parserState.isParserState) {
    throw new Error('parserState must be a ParserState')
  }
  const ret = parser(parserState)
  if (ret.then) {
    return ret
  } else {
    return Promise.resolve(ret)
  }
}

export function mergeErrors (err1, err2) {
  if (!err1 || (!err1.messages.length && err2.messages.length)) {
    return err2
  } else if (!err2 || (!err2.messages.length && err1.messages.length)) {
    return err1
  } else {
    switch (comparePositions(err1.position, err2.position)) {
      case 'gt':
        return err1
      case 'lt':
        return err2
      case 'eq':
        var newMessages =
          (err1.messages.concat(err2.messages)).reduce((acc, x) => {
            return (~acc.indexOf(x)) ? acc : acc.concat([x])
          }, [])
        return new ParserError(err2.position,
                               newMessages,
                               err2.type,
                               err2.wasEof || err1.wasEof)
      default:
        throw new Error('This should never happen')
    }
  }
}

function comparePositions (pos1, pos2) {
  if (pos1.line < pos2.line) {
    return 'lt'
  } else if (pos1.line > pos2.line) {
    return 'gt'
  } else if (pos1.column < pos2.column) {
    return 'lt'
  } else if (pos1.column > pos2.column) {
    return 'gt'
  } else {
    return 'eq'
  }
}

export class ParserState {
  constructor (value, input, offset, userState,
               position, hasConsumed, error, failed) {
    this.value = value
    this.input = input
    this.offset = offset
    this.position = position
    this.userState = userState
    this.failed = failed
    this.error = error
  }
  copy () {
    return new ParserState(this.value,
                           this.input,
                           this.offset,
                           this.userState,
                           this.position,
                           this.hasConsumed,
                           this.error,
                           this.failed)
  }
}

/**
 * Represents a source location.
 * @typedef {Object} SourcePosition
 * @property {String} name - Optional sourcefile name.
 * @property {Integer} line - Line number, starting from 1.
 * @property {Integer} column - Column number in the line, starting from 1.
 * @memberof module:mona/api
 * @instance
 */
export function SourcePosition (name, line, column) {
  this.name = name
  this.line = line || 1
  this.column = column || 0
}

/**
 * Information about a parsing failure.
 * @typedef {Object} ParserError
 * @property {api.SourcePosition} position - Source position for the error.
 * @property {Array} messages - Array containing relevant error messages.
 * @property {String} type - The type of parsing error.
 * @memberof module:mona/api
 */
export function ParserError (pos, messages, type, wasEof) {
  if (Error.captureStackTrace) {
    // For pretty-printing errors on node.
    Error.captureStackTrace(this, this)
  }
  this.position = pos
  this.messages = messages
  this.type = type
  this.wasEof = wasEof
  this.message = ('(line ' + this.position.line +
                  ', column ' + this.position.column + ') ' +
                  this.messages.join('\n'))
}
ParserError.prototype = new Error()
ParserError.prototype.constructor = ParserError
ParserError.prototype.name = 'ParserError'
