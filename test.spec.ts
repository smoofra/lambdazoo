import { equal } from "assert";
import {expectEOF} from "typescript-parsec"
import {TERM, tokenizer, termTree, Term} from "./hello"

function parse(s : string) : Term {
    const r = expectEOF(TERM.parse(tokenizer.parse(s)));
    equal (r.successful, true)
    if (r.successful) {
        equal(r.candidates.length, 1)
        return r.candidates[0].result;
    }
    throw new Error("failed.")
}

describe("lambdazoo tests", () => {
  it("should associate application to the left", () => {
    equal(termTree(parse("FOO BAR BAZ QUUX")), "(((FOO BAR) BAZ) QUUX)");
  });
  it("should bind calls stronger than lambdas", () => {
    equal(termTree(parse("λ x → x x")), "(λx→(x x))")
  });
});
