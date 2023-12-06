
import { Token, Parser, ParserOutput, ParseError, ParseResult } from 'typescript-parsec';
import { betterError, resultOrError, buildLexer, expectEOF, expectSingleResult, rule } from 'typescript-parsec';
import { alt, apply, kmid, lrec_sc, seq, str, tok, rep_sc, amb } from 'typescript-parsec';

export { TERM, Term, termTree, tokenizer };

type Term = Identifier | Lambda | Call;

interface Identifier {
    type: "identifier";
    name: string;
}

interface Lambda {
    type: "lambda";
    argument: string;
    term: Term;
}

interface Call {
    type: "call";
    func: Term;
    argument: Term;
}

enum TokenKind {
    Lambda,
    Arrow,
    LParen,
    RParen,
    Identifier,
    Space,
}

const tokenizer = buildLexer([
    [true, /^λ/g, TokenKind.Lambda],
    [true, /^→/g, TokenKind.Arrow],
    [true, /^\(/g, TokenKind.LParen],
    [true, /^\)/g, TokenKind.RParen],
    [true, /^\w+/g, TokenKind.Identifier],
    [false, /^\s+/g, TokenKind.Space]
])

const TERM = rule<TokenKind, Term>();

const LAMBDA_TERM : Parser<TokenKind, Lambda> =
    apply(
        seq(str("λ"), tok(TokenKind.Identifier), str("→"), TERM),
        function(value: [any, Token<TokenKind.Identifier>, any, Term], tokenRange:any) {
            return {type:"lambda", argument: value[1].text, term: value[3]};
        }
    )

const IDENTIFIER_TERM: Parser<TokenKind, Identifier> =
    apply(
        tok(TokenKind.Identifier),
        function(value: Token<TokenKind.Identifier>, tokenRange: any) {
            return {type: "identifier", name: value.text};
        });

const PAREN_TERM : Parser<TokenKind, Term> =
    apply(
        seq(str("("), TERM, str(")")),
        function(value: [any, Term, any], tokenRange: any) {
            return value[1];
        }
    )

function buildCalls(a:  Term, b: Term, cs: Term[]): Call {
    if (!cs.length)  {
        return {type:"call", func:a, argument:b};
    } else {
        return buildCalls({type:"call", func:a, argument:b}, cs[0], cs.slice(1));
    }
}

const CALL_TERM_ambig : Parser<TokenKind, Call> =
    apply(
        alt(
            seq(IDENTIFIER_TERM, TERM, rep_sc(TERM)),
            seq(LAMBDA_TERM, TERM, rep_sc(TERM)),
            seq(PAREN_TERM, TERM, rep_sc(TERM)),
        ),
        function(value: [Term, Term, Term[]], tokenRange: any) {
            return buildCalls(value[0], value[1], value[2]);
        }
    )

const CALL_TERM : Parser<TokenKind, Call> =
    apply(
        amb(CALL_TERM_ambig),
        function(value:Call[], tokenRange: any) {
            return value[0]
        }
    )


TERM.setPattern(
    apply(
        amb(alt(
            PAREN_TERM,
            IDENTIFIER_TERM,
            CALL_TERM,
            LAMBDA_TERM)),
        function(value:Term[], tokenRange) {
            if (value.length == 1) {
                return value[0];
            }
            const lambdas = value.filter(t => t.type == 'lambda');
            if (lambdas.length == 1) {
                return lambdas[0];
            }
            throw new Error("can't resolve ambiguity");
        })
)

function termTree(term: Term): string {
    switch(term.type) {
        case "call":
            return "(" + termTree(term.func) + " " + termTree(term.argument) + ")";
        case "lambda":
            return "(" + "λ" + term.argument + "→" + termTree(term.term) + ")";
        case "identifier":
            return term.name
    }
}