
import { Token, Parser, ParserOutput, ParseError, ParseResult, rep } from 'typescript-parsec';
import { betterError, resultOrError, buildLexer, expectEOF, expectSingleResult, rule } from 'typescript-parsec';
import { alt, apply, kmid, lrec_sc, seq, str, tok, rep_sc, amb } from 'typescript-parsec';

export { TERM, TOPLEVEL, λ0, Term, Declaration, termTree, tokenizer };

type Language = {
    "term": unknown
    "declaration": unknown
}

type Term<α extends Language> = α["term"]
type Declaration<α extends Language> = α["declaration"]

type Identifier<α> = {
    kind: "identifier"
    name: string
}

type Lambda<α extends Language> = {
    kind: "lambda"
    argument: string
    term: Term<α>
}

type Call<α extends Language> = {
    kind: "call"
    func: Term<α>
    argument: Term<α>
}

interface Let<α extends Language> {
    kind: "let"
    name: string
    term: Term<α>
}

type UntypedLambdaCalculus<α extends Language> = {
    "term": Identifier<α> | Lambda<α> | Call<α>
    "declaration": Let<α>
}

// construct a fixed point, λ0 = UntypedLambdaCalculus<λ0>
type λ0 = {[k in keyof Language]: UntypedLambdaCalculus<λ0>[k]}

enum TokenKind {
    Lambda,
    Arrow,
    LParen,
    RParen,
    Equals,
    Identifier,
    Space,
}

const tokenizer = buildLexer([
    [true, /^λ/g, TokenKind.Lambda],
    [true, /^→/g, TokenKind.Arrow],
    [true, /^\(/g, TokenKind.LParen],
    [true, /^\)/g, TokenKind.RParen],
    [true, /^\w+/g, TokenKind.Identifier],
    [true, /^=/g, TokenKind.Equals],
    [false, /^\s+/g, TokenKind.Space]
])

const TERM = rule<TokenKind, Term<λ0>>();

const LAMBDA_TERM : Parser<TokenKind, Lambda<λ0>> =
    apply(
        seq(str("λ"), tok(TokenKind.Identifier), str("→"), TERM),
        function(value: [unknown, Token<TokenKind.Identifier>, unknown, Term<λ0>], tokenRange) {
            return {kind:"lambda", argument: value[1].text, term: value[3]};
        }
    )

const IDENTIFIER_TERM: Parser<TokenKind, Identifier<λ0>> =
    apply(
        tok(TokenKind.Identifier),
        function(value: Token<TokenKind.Identifier>, tokenRange) {
            return {kind: "identifier", name: value.text};
        });

const PAREN_TERM : Parser<TokenKind, Term<λ0>> =
    apply(
        seq(str("("), TERM, str(")")),
        function(value: [unknown, Term<λ0>, unknown], tokenRange) {
            return value[1];
        }
    )

function buildCalls(a:  Term<λ0>, b: Term<λ0>, cs: Term<λ0>[]): Call<λ0> {
    if (!cs.length)  {
        return {kind:"call", func:a, argument:b};
    } else {
        return buildCalls({kind:"call", func:a, argument:b}, cs[0], cs.slice(1));
    }
}

const CALL_TERM_ambig : Parser<TokenKind, Call<λ0>> =
    apply(
        alt(
            seq(IDENTIFIER_TERM, TERM, rep_sc(TERM)),
            seq(LAMBDA_TERM, TERM, rep_sc(TERM)),
            seq(PAREN_TERM, TERM, rep_sc(TERM)),
        ),
        function(value: [Term<λ0>, Term<λ0>, Term<λ0>[]], tokenRange) {
            return buildCalls(value[0], value[1], value[2]);
        }
    )

const CALL_TERM : Parser<TokenKind, Call<λ0>> =
    apply(
        amb(CALL_TERM_ambig),
        function(value:Call<λ0>[], tokenRange) {
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
        function(value:Term<λ0>[], tokenRange) {
            if (value.length == 1) {
                return value[0];
            }
            const lambdas = value.filter(t => t.kind == 'lambda');
            if (lambdas.length == 1) {
                return lambdas[0];
            }
            throw new Error("can't resolve ambiguity");
        })
)

const DECLARATION : Parser<TokenKind, Declaration<λ0>> =
    apply(
        seq(tok(TokenKind.Identifier), str("="), TERM),
        function(value: [Token<TokenKind.Identifier>, unknown, Term<λ0>], tokenRange) {
            let [id, _, term] = value
            return {
                kind: "let",
                name: id.text,
                term: term,
            }
        })

const TOPLEVEL : Parser<TokenKind, Declaration<λ0>[]> = rep(DECLARATION)

function termTree(term: Term<λ0>): string {
    switch(term.kind) {
        case "call":
            return "(" + termTree(term.func) + " " + termTree(term.argument) + ")";
        case "lambda":
            return "(" + "λ" + term.argument + "→" + termTree(term.term) + ")";
        case "identifier":
            return term.name
    }
}