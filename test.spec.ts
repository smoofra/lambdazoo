import { ok, strictEqual } from "assert";
import {termTree, toJavascript, parseTerm, parseToplevel} from "./lambda"

let src = `
id = λ x → x
meta = λ x → x x
`


describe("lambdazoo tests", () => {
  it("should associate application to the left", () => {
    strictEqual(termTree(parseTerm("FOO BAR BAZ QUUX")), "(((FOO BAR) BAZ) QUUX)");
  });
  it("should bind calls stronger than lambdas", () => {
    strictEqual(termTree(parseTerm("λ x → x x")), "(λx→(x x))")
  });
  it("parse toplevel declarations", () => {
    let [id, meta] = parseToplevel(src)
    strictEqual(id.name, "id")
    strictEqual(termTree(id.term), "(λx→x)")
    strictEqual(meta.name, "meta")
    strictEqual(termTree(meta.term), "(λx→(x x))")
  });
  it("translate to javascript", () => {
    const two = eval(toJavascript(parseTerm("λ x → λ y → x (x y)")))
    const inc = (x:number) => x + 1
    strictEqual(two(inc)(0), 2)
    strictEqual(two(inc)(1), 3)
  });
})
