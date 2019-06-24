"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ScriptError extends Error {
    constructor({ message, stack }, cb) {
        super(message);
        this.stack = stack;
        this.cb = cb;
    }
}
exports.default = ScriptError;
//# sourceMappingURL=ScriptError.js.map