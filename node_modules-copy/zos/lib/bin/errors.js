"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorHandler_1 = __importDefault(require("../models/errors/ErrorHandler"));
function registerErrorHandler(program) {
    const cb = (error) => new ErrorHandler_1.default(error, program).call();
    process.on('unhandledRejection', cb);
    process.on('uncaughtException', cb);
    program.on('command:*', function () {
        console.error(`Invalid command: ${program.args.join(' ')}\nSee --help for a list of available commands.`);
        process.exit(1);
    });
}
exports.default = registerErrorHandler;
//# sourceMappingURL=errors.js.map