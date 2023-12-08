import { strictEqual } from "assert";
import {expectEOF} from "typescript-parsec"
import {TERM, λ0, tokenizer, termTree, Term, toJavascript, Declaration, TOPLEVEL} from "./lambda"

function parseTerm(s : string) : Term<λ0> {
    const r = expectEOF(TERM.parse(tokenizer.parse(s)));
    strictEqual (r.successful, true)
    if (r.successful) {
        strictEqual(r.candidates.length, 1)
        return r.candidates[0].result;
    }
    throw new Error("failed.")
}

function parseToplevel(s : string) : Declaration<λ0>[] {
  const r = expectEOF(TOPLEVEL.parse(tokenizer.parse(s)));
  strictEqual (r.successful, true)
  if (r.successful) {
      strictEqual(r.candidates.length, 1)
      return r.candidates[0].result;
  }
  throw new Error("failed.")
}

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
