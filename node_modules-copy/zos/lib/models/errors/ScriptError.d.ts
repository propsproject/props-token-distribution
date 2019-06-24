export default class ScriptError extends Error {
    stack: any;
    cb: () => void;
    constructor({ message, stack }: {
        message: string;
        stack: string;
    }, cb: () => void);
}
