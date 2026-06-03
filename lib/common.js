import * as fs from 'fs';
import {APIError, InvalidArgumentException} from "./exception.js";

/**
 * Module-level override for the API base endpoint. Empty means use the
 * region-based default. Set via {@link SetEndpoint}.
 *
 * @private
 * @type {string}
 */
var _endpoint = ''

/**
 * Normalize an image/file input into the value expected by the API. The input
 * may be a cache reference ("ref:..."), a URL, a local file path (which is read
 * and base64-encoded), or an already-base64-encoded/long string.
 *
 * @param {string} str Input value: a "ref:" cache reference, a URL, a local
 *   file path, or a base64-encoded image string.
 * @param {boolean} [allowCache=false] If `true`, a value starting with "ref:"
 *   is returned unchanged as a cache reference.
 * @returns {string} The URL, cache reference, or base64-encoded file contents.
 * @throws {InvalidArgumentException} If the input is neither a valid URL, an
 *   existing file, nor a sufficiently long string to be treated as inline data.
 */
export function ParseInput(str, allowCache=false) {
    if(allowCache && str.slice(0, 4) === 'ref:') {
        return str
    }
    try {
        new URL(str)
        return str
    } catch (e) {}

    if (fs.existsSync(str)) {
        let data = fs.readFileSync(str)
        return Buffer.from(data).toString('base64')
    }

    if(str.length > 100) {
        return str
    }
    throw new InvalidArgumentException('Invalid input image, file not found or malformed URL.')
}

/**
 * Map of supported region codes to their API base URLs.
 *
 * @private
 * @type {Object<string, string>}
 */
const REGION_ENDPOINTS = {
    us: 'https://api2.idanalyzer.com',
    eu: 'https://api2-eu.idanalyzer.com',
}

/**
 * Resolve a request URI into a fully-qualified URL. Absolute URLs are returned
 * unchanged. Otherwise the URI is resolved against the override endpoint set by
 * {@link SetEndpoint}, or, if none is set, against the base URL for the region
 * given by the `IDANALYZER_REGION` environment variable (defaults to "us").
 *
 * @param {string} uri An absolute URL, or a path relative to the API base URL.
 * @returns {string} The fully-qualified request URL.
 * @throws {InvalidArgumentException} If `IDANALYZER_REGION` is set to an unsupported region.
 */
export function GetEndpoint(uri) {
    if (uri.slice(0, 4).toLowerCase() === 'http')
        return uri

    if(_endpoint !== '') {
        let u = new URL(uri, _endpoint)
        return u.href
    }

    let region = (process.env.IDANALYZER_REGION || 'us').toLowerCase()
    if(!(region in REGION_ENDPOINTS)) {
        throw new InvalidArgumentException(`Invalid IDANALYZER_REGION '${region}', valid regions are: us, eu.`)
    }
    return `${REGION_ENDPOINTS[region]}/${uri}`
}

/**
 * Override the API base endpoint for all subsequent requests, bypassing the
 * region-based default. Pass an empty string to clear the override and revert
 * to region-based resolution.
 *
 * @param {string} [endpoint=''] Fully-qualified base URL to use as the API endpoint.
 * @returns {void}
 * @throws {TypeError} If `endpoint` is not a valid URL.
 */
export function SetEndpoint(endpoint='') {
    let i = new URL('', endpoint)
    _endpoint = endpoint
}

/**
 * Inspect a decoded API response and optionally raise on an error payload.
 *
 * @param {Object<string, *>} respJson The decoded JSON response body.
 * @param {boolean} throwError If `true` and the response contains an `error`
 *   object, an {@link APIError} is thrown instead of returning the response.
 * @returns {Object<string, *>} The original response object (when not throwing).
 * @throws {APIError} If `throwError` is `true` and the response contains an error.
 */
export function ApiExceptionHandle(respJson, throwError) {
    if ('error' in respJson && throwError) {
        throw new APIError(respJson['error']['message'], respJson['error']['code'])
    }
    return respJson
}
