
import { strictEqual } from "node:assert";
import {termTree, toJavascript, parseTerm, parseToplevel} from "./lambda.ts"

Deno.test("left association", () => {
    strictEqual(termTree(parseTerm("FOO BAR BAZ QUUX")), "(((FOO BAR) BAZ) QUUX)");
})

Deno.test("bind calls stronger than lambda", () => {
    strictEqual(termTree(parseTerm("λ x . x x")), "(λx.(x x))")
})


const src = `
id = λx. x
meta = λx. x x
`

Deno.test("parse toplevel declarations", () => {
    const [id, meta] = parseToplevel(src)
    strictEqual(id.name, "id")
    strictEqual(termTree(id.term), "(λx.x)")
    strictEqual(meta.name, "meta")
    strictEqual(termTree(meta.term), "(λx.(x x))")
})

Deno.test("translate to javascript", () => {
    const two = eval(toJavascript(parseTerm("λx. λ y . x (x y)")))
    const inc = (x:number) => x + 1
    strictEqual(two(inc)(0), 2)
    strictEqual(two(inc)(1), 3)
})