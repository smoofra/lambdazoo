import { strictEqual } from "assert";
import {expectEOF} from "typescript-parsec"
import {TERM, tokenizer, termTree, Term, Declaration, TOPLEVEL} from "./lambda"

function parseTerm(s : string) : Term {
    const r = expectEOF(TERM.parse(tokenizer.parse(s)));
    strictEqual (r.successful, true)
    if (r.successful) {
        strictEqual(r.candidates.length, 1)
        return r.candidates[0].result;
    }
    throw new Error("failed.")
}

function parseToplevel(s : string) : Declaration[] {
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
  })
});
