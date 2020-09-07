
import { Token, Parser } from 'typescript-parsec';
import { buildLexer, expectEOF, expectSingleResult, rule } from 'typescript-parsec';
import { alt, apply, kmid, lrec_sc, seq, str, tok } from 'typescript-parsec';

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

const TERM = rule<TokenKind, unknown>();

const LAMBDA_TERM : Parser<TokenKind, unknown> =
    seq(str("λ"), tok(TokenKind.Identifier), str("→"), TERM);

const PAREN_TERM : Parser<TokenKind, unknown> =
    seq(str("("), TERM, str(")"));

const CALL_TERM : Parser<TokenKind, unknown> =
    alt(
        seq(tok(TokenKind.Identifier), TERM),
        seq(LAMBDA_TERM, TERM),
        seq(PAREN_TERM, TERM),
    );

TERM.setPattern(
    alt(
        tok(TokenKind.Identifier),
        LAMBDA_TERM,
        CALL_TERM,
        PAREN_TERM,
    )
)

// ambiguous!
const r = expectEOF(TERM.parse(tokenizer.parse("λ x → x x")));

if (r.successful) {
    for (const c of r.candidates) {
        console.log("!!!", c);
    }
}



