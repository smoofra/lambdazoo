
import { assertEquals } from "@std/assert";
import {termTree, toJavascript, parseTerm, parseToplevel} from "./lambda.ts"

Deno.test("left association", () => {
    assertEquals(termTree(parseTerm("FOO BAR BAZ QUUX")), "(((FOO BAR) BAZ) QUUX)");
})

Deno.test("bind calls stronger than lambda", () => {
    assertEquals(termTree(parseTerm("λ x . x x")), "(λx.(x x))")
})


const src = `
id = λx. x
meta = λx. x x
`

Deno.test("parse toplevel declarations", () => {
    const [id, meta] = parseToplevel(src)
    assertEquals(id.name, "id")
    assertEquals(termTree(id.term), "(λx.x)")
    assertEquals(meta.name, "meta")
    assertEquals(termTree(meta.term), "(λx.(x x))")
})

Deno.test("translate to javascript", () => {
    const two = eval(toJavascript(parseTerm("λx. λ y . x (x y)")))
    const inc = (x:number) => x + 1
    assertEquals(two(inc)(0), 2)
    assertEquals(two(inc)(1), 3)
})