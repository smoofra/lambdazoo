
import * as ohm from 'ohm-js'

export class StartOfLine extends ohm.pexprs.PExpr {

    constructor() {
        super();
    }

    allowsSkippingPrecedingSpace() {
        return false;
    }

    eval(state) {
        const {inputStream} = state;
        if (inputStream.pos == 0) {
            return true
        }
        return inputStream.source[inputStream.pos-1] == "\n"
        }

    getArity() {
        return 1;
    }

    _assertAllApplicationsAreValid(ruleName, grammar) {}

    _isNullable(grammar, memo) {
        return true;
    }

    assertChoicesHaveUniformArity(ruleName) {}

    assertIteratedExprsAreNotNullable(grammar) {}

    introduceParams(formals) {
        return this;
    }

    substituteParams(actuals) {
        return this;
    }

    toString() {
        return 'startOfLine'
    }

    toDisplayString() {
        return this.toString();
    }
}

export function patch(grammar) { 
    grammar.rules.StartOfLine = {
        body: new StartOfLine(),
        formals: [],
        description: "start of line",
        primitive: true
    }
}
