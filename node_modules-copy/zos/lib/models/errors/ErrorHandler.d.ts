import { Command } from 'commander';
import ScriptError from './ScriptError';
export default class ErrorHandler {
    error: ScriptError | any;
    verbose: boolean;
    constructor(error: ScriptError | any, { verbose }: Command);
    call(): void;
}
