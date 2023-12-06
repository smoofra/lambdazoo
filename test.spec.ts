import { strictEqual } from "assert";
import {expectEOF} from "typescript-parsec"
import {TERM, tokenizer, termTree, Term} from "./hello"

function parse(s : string) : Term {
    const r = expectEOF(TERM.parse(tokenizer.parse(s)));
    strictEqual (r.successful, true)
    if (r.successful) {
        strictEqual(r.candidates.length, 1)
        return r.candidates[0].result;
    }
    throw new Error("failed.")
}

describe("lambdazoo tests", () => {
  it("should associate application to the left", () => {
    strictEqual(termTree(parse("FOO BAR BAZ QUUX")), "(((FOO BAR) BAZ) QUUX)");
  });
  it("should bind calls stronger than lambdas", () => {
    strictEqual(termTree(parse("λ x → x x")), "(λx→(x x))")
  });
});
