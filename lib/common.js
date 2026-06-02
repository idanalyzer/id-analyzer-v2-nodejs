import * as fs from 'fs';
import {APIError, InvalidArgumentException} from "./exception.js";

var _endpoint = ''

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

const REGION_ENDPOINTS = {
    us: 'https://api2.idanalyzer.com',
    eu: 'https://api2-eu.idanalyzer.com',
}

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

export function SetEndpoint(endpoint='') {
    let i = new URL('', endpoint)
    _endpoint = endpoint
}

export function ApiExceptionHandle(respJson, throwError) {
    if ('error' in respJson && throwError) {
        throw new APIError(respJson['error']['message'], respJson['error']['code'])
    }
    return respJson
}
