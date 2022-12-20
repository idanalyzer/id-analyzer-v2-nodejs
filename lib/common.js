import * as fs from 'fs';
import {APIError, InvalidArgumentException} from "./exception.js";

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
    return new InvalidArgumentException('Invalid input image, file not found or malformed URL.')
}

export function GetEndpoint(uri) {
    if (uri.slice(0, 4).toLowerCase() === 'http')
        return uri

    let region = process.env.IDANALYZER_REGION
    if(!region) {
        return `https://v2-us1.idanalyzer.com/${uri}`
    } else if (region.toLowerCase() === 'eu') {
        return `https://api2-eu.idanalyzer.com/${uri}`
    }
}

export function ApiExceptionHandle(respJson, throwError) {
    if ('error' in respJson && throwError) {
        throw new APIError(respJson['error']['message'], respJson['error']['code'])
    }
    return respJson
}
