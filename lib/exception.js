/**
 * Error thrown when the ID Analyzer API returns an error payload and exception
 * throwing is enabled via {@link _ApiParent#throwApiException}.
 *
 * @extends Error
 */
export class APIError extends Error {
    /**
     * @param {string} message Human-readable error message from the API.
     * @param {number|string} code Machine-readable error code from the API.
     */
    constructor(message, code) {
        super(message);
        /**
         * Human-readable error message from the API.
         * @type {string}
         */
        this.msg = message
        /**
         * Machine-readable error code from the API.
         * @type {number|string}
         */
        this.code = code
    }
}

/**
 * Error thrown when an argument passed to an SDK method is missing or invalid.
 *
 * @extends Error
 */
export class InvalidArgumentException extends Error {}