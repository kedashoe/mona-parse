import {eof} from '@mona/core'
import {followedBy} from '@mona/combinators'
import {invokeParser, ParserState, SourcePosition} from '@mona/internals'

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
export function parse (parser, string, opts = {}) {
  // TODO - work off streams
  if (!opts.allowTrailing) {
    parser = followedBy(parser, eof())
  }
  return invokeParser(
    parser,
    new ParserState(undefined,
                    string,
                    0,
                    opts.userState,
                    opts.position || new SourcePosition(opts.fileName),
                    false)
  ).then(parserState => {
    if (opts.returnState) {
      return parserState
    } else if (parserState.failed) {
      throw parserState.error
    } else {
      return parserState.value
    }
  })
}
