export class APIError extends Error {
    constructor(message, code) {
        super(message);
        this.msg = message
        this.code = code
    }
}
export class InvalidArgumentException extends Error {}