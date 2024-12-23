
import * as ohm from 'ohm-js'

// @ts-types="./lambda.ohm-bundle.d.ts"
import grammar, {UntypedLambdaCalculusSemantics} from './lambda.ohm-bundle.js'
import { patch } from './builtins.js'

patch(grammar)
export { grammar }

type Language = {
    "term": unknown
    "declaration": unknown
}

export type Term<α extends Language> = α["term"]
export type Declaration<α extends Language> = α["declaration"]

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
export type λ0 = {[k in keyof Language]: UntypedLambdaCalculus<λ0>[k]}

export function termTree(term: Term<λ0>): string {
    switch(term.kind) {
        case "call":
            return "(" + termTree(term.func) + " " + termTree(term.argument) + ")";
        case "lambda":
            return "(" + "λ" + term.argument + "." + termTree(term.term) + ")";
        case "identifier":
            return term.name
    }
}

export function toJavascript(term: Term<λ0>): string {
    switch(term.kind) {
        case "call":
            return `${toJavascript(term.func)}(${toJavascript(term.argument)})`
        case "lambda":
            return `(${term.argument}) => {return ${toJavascript(term.term)}}`
        case "identifier":
            return term.name
    }
}

const semantics: UntypedLambdaCalculusSemantics = grammar.createSemantics()

interface Node {
    term(): Term<λ0>
    declaration(): Declaration<λ0>
    toplevel(): Declaration<λ0>[]
    identifier(): string
}

// coerce a semantics dictionary from ohm to someting less type-erased
function S(n: ohm.Dict): Node {
    return (n as unknown) as Node
}

semantics.addOperation<Term<λ0>>('term()', {
    Identifier(x) {
        return {kind: "identifier", name: x.sourceString}
    },
    Lambda(_, arg, __, term) {
        return {kind: "lambda", argument: S(arg).identifier(), term: S(term).term()}
    },
    Parens(_, term, __) {
        return S(term).term()
    },
    Call(func, args) {
        let t : Term<λ0> = S(func).term()
        for (const arg of args.children) {
            t = {kind: "call", func: t, argument: S(arg).term()}
        }
        return t
    },
})

semantics.addOperation<string>('identifier()', {
    Identifier(x): string {
        return x.sourceString
    }
})

semantics.addOperation<Declaration<λ0>>('declaration()', {
    Declaration(_, name, __, term) {
        return {kind: "let", name: S(name).identifier(), term: S(term).term()}
    }
})

semantics.addOperation<Declaration<λ0>[]>('toplevel()', {
    Toplevel(declarations) {
        return declarations.children.map(d => S(d).declaration())
    }
})

export function parseTerm(s: string): Term<λ0> {
    const m = grammar.match(s, "Term")
    if (!m.succeeded()) {
        throw new Error(m.message)
    }
    return S(semantics(m)).term()
}

export function parseToplevel(s: string): Declaration<λ0>[] {
    const m = grammar.match(s, "Toplevel")
    if (!m.succeeded()) {
        throw new Error(m.message)
    }
    return S(semantics(m)).toplevel()
}