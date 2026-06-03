import {ApiExceptionHandle, GetEndpoint, ParseInput, SetEndpoint} from "./common.js";

import {APIError, InvalidArgumentException} from './exception.js'
import * as fs from 'fs';
import axios from "axios";

/**
 * A decoded JSON object returned by the ID Analyzer API. The exact shape
 * depends on the endpoint; see the API reference at
 * https://developer.idanalyzer.com for per-endpoint response schemas.
 *
 * @typedef {Object<string, *>} ApiResponse
 */

/**
 * Internal base class shared by all API client classes. Handles API key
 * resolution, the shared request configuration object and the underlying
 * axios HTTP client. Not intended to be instantiated directly.
 *
 * @private
 */
class _ApiParent {
    /**
     * Create a new API client. The API key is resolved from the explicit
     * argument, falling back to the `IDANALYZER_KEY` environment variable.
     *
     * @param {string|null} [apiKey=null] Your API key. If omitted, the
     *   `IDANALYZER_KEY` environment variable is used.
     * @throws {Error} If no API key can be resolved.
     */
    constructor(apiKey=null) {
        this.client_library = "nodejs-sdk"
        this.apiKey = this.getApiKey(apiKey)
        if(!this.apiKey) {
            throw new Error("Please set API key via environment variable 'IDANALYZER_KEY'")
        }
        this.config = {
            "client": this.client_library,
        }
        this.throwError = false
        this.http = axios.create({
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': this.apiKey,
            },
            validateStatus: () => true,
        })
    }

    /**
     * Resolve the API key, preferring the provided value and falling back to
     * the `IDANALYZER_KEY` environment variable.
     *
     * @param {string|null} [customKey=null] Explicitly supplied API key.
     * @returns {string|null} The resolved API key, or `null` if none is available.
     */
    getApiKey(customKey=null) {
        return customKey ?? process.env.IDANALYZER_KEY ?? null
    }

    /**
     * Set an API parameter and its value, this function allows you to set any API parameter without using the built-in functions
     *
     * @param {string} key Parameter key
     * @param {*} value Parameter value
     * @returns {void}
     */
    setParam(key, value) {
        this.config[key] = value
    }

    /**
     * Whether an exception should be thrown if API response contains an error message
     *
     * @param {boolean} [sw=false] Set to `true` to throw an {@link APIError}
     *   when the API response contains an error, or `false` to return the raw
     *   error response instead.
     * @returns {void}
     */
    throwApiException(sw=false) {
        this.throwError = sw
    }
}

/**
 * KYC Profile builder. A profile defines how documents are processed and
 * validated. You may reference a preset profile (one of the `SECURITY_*`
 * constants) or a custom profile ID, and optionally layer per-request
 * overrides on top using the setter methods on this class. The resulting
 * object is passed to {@link Scanner#setProfile} or {@link Biometric#setProfile}.
 */
class Profile {
    /** Preset profile applying no validation. @type {string} */
    static SECURITY_NONE = "security_none"
    /** Preset profile applying low-strictness validation. @type {string} */
    static SECURITY_LOW = "security_low"
    /** Preset profile applying medium-strictness validation. @type {string} */
    static SECURITY_MEDIUM = "security_medium"
    /** Preset profile applying high-strictness validation. @type {string} */
    static SECURITY_HIGH = "security_high"
    /**
     * Initialize KYC Profile
     *
     * @param {string} profileId Custom profile ID or preset profile (security_none, security_low, security_medium, security_high). SECURITY_NONE will be used if left blank.
     */
    constructor(profileId) {
        this.URL_VALIDATION_REGEX = "((?:[a-z][\w-]+:(?:/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'\".,<>?«»“”‘’]))"
        this.profileId = profileId !== '' ? profileId : this.SECURITY_NONE
        this.profileOverride = {}
    }

    /**
     * Set profile configuration with provided JSON string
     *
     * @param {string} [jsonStr='{}'] JSON string containing profile information.
     * @returns {void}
     */
    loadFromJson(jsonStr = '{}') {
        this.profileOverride = JSON.parse(jsonStr)
    }

    /**
     * Canvas Size in pixels, input image larger than this size will be scaled down before further processing, reduced image size will improve inference time but reduce result accuracy. Set 0 to disable image resizing.
     *
     * @param {number} pixels Maximum canvas dimension in pixels. Set 0 to disable resizing.
     * @returns {void}
     */
    canvasSize(pixels) {
        this.profileOverride['canvasSize'] = pixels
    }

    /**
     * Correct image orientation for rotated images
     *
     * @param {boolean} enabled Whether to enable automatic orientation correction.
     * @returns {void}
     */
    orientationCorrection(enabled) {
        this.profileOverride['orientationCorrection'] = enabled
    }

    /**
     * Enable to automatically detect and return the locations of signature, document and face.
     *
     * @param {boolean} enabled Whether to enable object detection.
     * @returns {void}
     */
    objectDetection(enabled) {
        this.profileOverride['objectDetection'] = enabled
    }

    /**
     * Enable to parse AAMVA barcode for US/CA ID/DL. Disable this to improve performance if you are not planning on scanning ID/DL from US or Canada.
     *
     * @param {boolean} enabled Whether to enable AAMVA barcode parsing.
     * @returns {void}
     */
    AAMVABarcodeParsing(enabled) {
        this.profileOverride['AAMVABarcodeParsing'] = enabled
    }

    /**
     * Whether scan transaction results and output images should be saved on cloud
     *
     * @param {boolean} enableSaveTransaction Whether the scan transaction result should be saved on the cloud.
     * @param {boolean} enableSaveTransactionImages Whether the output images should also be saved on the cloud.
     * @returns {void}
     */
    saveResult(enableSaveTransaction, enableSaveTransactionImages) {
        this.profileOverride['saveResult'] = enableSaveTransaction
        if(enableSaveTransactionImages)
            this.profileOverride['saveImage'] = enableSaveTransactionImages
    }

    /**
     * Whether to return output image as part of API response
     *
     * @param {boolean} enableOutputImage Whether to return the output image in the API response.
     * @param {string} [outputFormat="url"] Output image format, either "url" or "base64".
     * @returns {void}
     */
    outputImage(enableOutputImage, outputFormat="url") {
        this.profileOverride['outputImage'] = enableOutputImage
        if(enableOutputImage)
            this.profileOverride['outputType'] = outputFormat
    }

    /**
     * Crop image before saving and returning output
     *
     * @param {boolean} enableAutoCrop Whether to automatically crop the document from the image.
     * @param {boolean} enableAdvancedAutoCrop Whether to enable advanced (perspective-corrected) auto cropping.
     * @returns {void}
     */
    autoCrop(enableAutoCrop, enableAdvancedAutoCrop) {
        this.profileOverride['crop'] = enableAutoCrop
        this.profileOverride['advancedCrop'] = enableAdvancedAutoCrop
    }

    /**
     * Maximum width/height in pixels for output and saved image.
     *
     * @param {number} pixels Maximum width/height in pixels for the output and saved image.
     * @returns {void}
     */
    outputSize(pixels) {
        this.profileOverride['outputSize'] = pixels
    }

    /**
     * Generate a full name field using parsed first name, middle name and last name.
     *
     * @param {boolean} enabled Whether to infer the full name field.
     * @returns {void}
     */
    inferFullName(enabled) {
        this.profileOverride['inferFullName'] = enabled
    }

    /**
     * If first name contains more than one word, move second word onwards into middle name field.
     *
     * @param {boolean} enabled Whether to split a multi-word first name into first and middle name.
     * @returns {void}
     */
    splitFirstName(enabled) {
        this.profileOverride['splitFirstName'] = enabled
    }

    /**
     * Enable to generate a detailed PDF audit report for every transaction.
     *
     * @param {boolean} enabled Whether to generate a PDF audit report for every transaction.
     * @returns {void}
     */
    transactionAuditReport(enabled) {
        this.profileOverride['transactionAuditReport'] = enabled
    }

    /**
     * Set timezone for audit reports. If left blank, UTC will be used. Refer to https://en.wikipedia.org/wiki/List_of_tz_database_time_zones TZ database name list.
     *
     * @param {string} timezone TZ database name (e.g. "America/New_York"). UTC is used if left blank.
     * @returns {void}
     */
    setTimezone(timezone) {
        this.profileOverride['timezone'] = timezone
    }

    /**
     * A list of data fields key to be redacted before transaction storage, these fields will also be blurred from output & saved image.
     *
     * @param {string[]} fieldKeys Array of data field keys to redact and blur.
     * @returns {void}
     */
    obscure(fieldKeys) {
        this.profileOverride['obscure'] = fieldKeys
    }

    /**
     * Enter a server URL to listen for Docupass verification and scan transaction results
     *
     * @param {string} [url="https://www.example.com/webhook.php"] Remote webhook URL. Must be a valid http/https URL pointing at a non-localhost host.
     * @returns {void}
     * @throws {InvalidArgumentException} If the URL is malformed, points to localhost, or uses a non-http(s) protocol.
     */
    webhook(url="https://www.example.com/webhook.php") {
        let reg = new RegExp(this.URL_VALIDATION_REGEX)
        let valid = reg.test(url)
        if(!valid) throw new InvalidArgumentException('Invalid URL format')

        let urlinfo = new URL(url)
        if(urlinfo.hostname === 'localhost') {
            throw new InvalidArgumentException('Invalid URL, the host does not appear to be a remote host.')
        }

        if(urlinfo.protocol !== 'http:' && urlinfo.protocol !== 'https:')
            throw new InvalidArgumentException("Invalid URL, only http and https protocols are allowed.")

        this.profileOverride['webhook'] = url
    }

    /**
     * Set validation threshold of a specified component
     *
     * @param {string} thresholdKey Threshold component key.
     * @param {number} thresholdValue Threshold value for the specified component.
     * @returns {void}
     */
    threshold(thresholdKey, thresholdValue) {
        if (!this.profileOverride['thresholds'])
            this.profileOverride['thresholds'] = {}
        this.profileOverride['thresholds'][thresholdKey] = thresholdValue
    }

    /**
     * Set decision trigger value
     *
     * @param {number} [reviewTrigger=1] If the final total review score is equal to or greater than this value, the final KYC decision will be "review".
     * @param {number} [rejectTrigger=1] If the final total review score is equal to or greater than this value, the final KYC decision will be "reject". Reject has higher priority than review.
     * @returns {void}
     */
    decisionTrigger(reviewTrigger = 1, rejectTrigger = 1) {
        this.profileOverride['decisionTrigger'] = {
            'review': reviewTrigger,
            'reject': rejectTrigger,
        }
    }

    /**
     * Enable/Disable and fine-tune how each Document Validation Component affects the final decision.
     *
     * @param {string} [code="UNRECOGNIZED_DOCUMENT"] Document Validation Component Code / Warning Code
     * @param {boolean} [enabled=true] Enable the current Document Validation Component
     * @param {number} [reviewThreshold=-1] If the current validation has failed to pass, and the specified number is greater than or equal to zero, and the confidence of this warning is greater than or equal to the specified value, the "total review score" will be added by the weight value.
     * @param {number} [rejectThreshold=0] If the current validation has failed to pass, and the specified number is greater than or equal to zero, and the confidence of this warning is greater than or equal to the specified value, the "total reject score" will be added by the weight value.
     * @param {number} [weight=1] Weight to add to the total review and reject score if the validation has failed to pass.
     * @returns {void}
     */
    setWarning(code = "UNRECOGNIZED_DOCUMENT", enabled = true, reviewThreshold = -1,
               rejectThreshold = 0, weight = 1) {
        if(this.profileOverride['decisions'])
            this.profileOverride['decisions'] = {}
        this.profileOverride['decisions'][code] = {
            "enabled": enabled,
            "review": reviewThreshold,
            "reject": rejectThreshold,
            "weight": weight,
        }
    }

    /**
     * Check if the document was issued by specified countries. Separate multiple values with comma. For example "US,CA" would accept documents from the United States and Canada.
     *
     * @param {string} [countryCodes="US,CA,UK"] ISO ALPHA-2 Country Code separated by comma
     * @returns {void}
     */
    restrictDocumentCountry(countryCodes = "US,CA,UK") {
        if(this.profileOverride['acceptedDocuments']) {
            this.profileOverride['acceptedDocuments'] = {}
        }
        this.profileOverride['acceptedDocuments']['documentCountry'] = countryCodes
    }

    /**
     * Check if the document was issued by specified state. Separate multiple values with comma. For example "CA,TX" would accept documents from California and Texas.
     *
     * @param {string} [states="CA,TX"] State full name or abbreviation separated by comma
     * @returns {void}
     */
    restrictDocumentState(states = "CA,TX") {
        if(this.profileOverride['acceptedDocuments']) {
            this.profileOverride['acceptedDocuments'] = {}
        }
        this.profileOverride['acceptedDocuments']['documentState'] = states
    }

    /**
     * Check if the document was one of the specified types. For example, "PD" would accept both passport and driver license.
     *
     * @param {string} [documentType="DIP"] P: Passport, D: Driver's License, I: Identity Card
     * @returns {void}
     */
    restrictDocumentType(documentType = "DIP") {
        if(this.profileOverride['acceptedDocuments']) {
            this.profileOverride['acceptedDocuments'] = {}
        }
        this.profileOverride['acceptedDocuments']['documentType'] = documentType
    }
}

/**
 * Biometric API client. Performs 1:1 face verification and standalone
 * liveness checks against the ID Analyzer biometric endpoints.
 *
 * @augments _ApiParent
 */
class Biometric extends _ApiParent {
    /**
     * Create a new Biometric API client.
     *
     * @param {string|null} [apiKey=null] Your API key. If omitted, the
     *   `IDANALYZER_KEY` environment variable is used.
     */
    constructor(apiKey = null) {
        super(apiKey);
        this.config = Object.assign(this.config, {
            "profile": "",
            "profileOverride": {},
            "customData": "",
        })
    }

    /**
     * Set an arbitrary string you wish to save with the transaction. e.g Internal customer reference number
     *
     * @param {string} customData Arbitrary string to store alongside the transaction.
     * @returns {void}
     */
    setCustomData(customData) {
        this.config['customData'] = customData
    }

    /**
     * Set KYC Profile
     *
     * @param {Profile} profile KYC {@link Profile} object.
     * @returns {void}
     * @throws {InvalidArgumentException} If `profile` is not a {@link Profile} instance.
     */
    setProfile(profile) {
        if (profile instanceof Profile) {
            this.config['profile'] = profile.profileId
            if(Object.keys(profile.profileOverride).length > 0) {
                this.config['profileOverride'] = profile.profileOverride
            } else {
                delete this.config['profileOverride']
            }
        } else {
            throw new InvalidArgumentException("Provided profile is not a 'KYCProfile' object.")
        }
    }

    /**
     * Perform 1:1 face verification using selfie photo or selfie video, against a reference face image.
     *
     * @param {string} [referenceFaceImage=''] Reference face image / front of document (file path, base64 content, URL, or cache reference).
     * @param {string} [facePhoto=""] Face Photo (file path, base64 content or URL, or cache reference). Provide either this or `faceVideo`.
     * @param {string} [faceVideo=""] Face Video (file path, base64 content or URL). Used if `facePhoto` is empty.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If no profile is configured, the reference image is missing, or no verification face is supplied.
     */
    async verifyFace(referenceFaceImage = '', facePhoto = "", faceVideo = "") {
        if (this.config['profile'] === '') {
            throw new InvalidArgumentException("KYC Profile not configured, please use setProfile before calling this function.")
        }
        let payload = this.config
        if (referenceFaceImage === '') {
            throw new InvalidArgumentException("Reference face image required.")
        }
        if(facePhoto === "" && faceVideo === "") {
            throw new InvalidArgumentException("Verification face image required.")
        }
        payload['reference'] = ParseInput(referenceFaceImage, true)
        if(facePhoto !== "") {
            payload['face'] = ParseInput(facePhoto, true)
        } else if(faceVideo !== '') {
            payload['faceVideo'] = ParseInput(faceVideo)
        }
        let resp = await this.http.post(GetEndpoint('face'), payload, {
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Perform standalone liveness check on a selfie photo or video.
     *
     * @param {string} [facePhoto=""] Face Photo (file path, base64 content or URL, or cache reference). Provide either this or `faceVideo`.
     * @param {string} [faceVideo=""] Face Video (file path, base64 content or URL). Used if `facePhoto` is empty.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If no profile is configured or no face image/video is supplied.
     */
    async verifyLiveness(facePhoto = "", faceVideo = "") {
        if (this.config['profile'] === '') {
            throw new InvalidArgumentException("KYC Profile not configured, please use setProfile before calling this function.")
        }
        let payload = this.config
        if(facePhoto === '' && faceVideo === '')
            throw new InvalidArgumentException('Verification face image required.')

        if(facePhoto !== '') {
            payload['face'] = ParseInput(facePhoto, true)
        } else if(faceVideo !== '') {
            payload['faceVideo'] = ParseInput(faceVideo)
        }
        let resp = await this.http.post(GetEndpoint('liveness'), payload, {
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }
}

/**
 * Contract API client. Manages contract templates and generates filled
 * documents (PDF/DOCX/HTML) from templates and transaction data.
 *
 * @augments _ApiParent
 */
class Contract extends _ApiParent {
    /**
     * Create a new Contract API client.
     *
     * @param {string|null} [apiKey=null] Your API key. If omitted, the
     *   `IDANALYZER_KEY` environment variable is used.
     */
    constructor(apiKey=null) {
        super(apiKey);
    }

    /**
     * Generate document using template and transaction data
     *
     * @param {string} [templateId=''] Template ID.
     * @param {string} [_format='PDF'] Output format: PDF, DOCX or HTML.
     * @param {string} [transactionId=''] Fill the template with data from the specified transaction.
     * @param {Object<string, *>|null} [fillData=null] Key-value pairs to autofill dynamic fields. Data from the user ID is used first in case of a conflict. For example, passing `{"myparameter":"abc"}` would fill `%{myparameter}` in the contract template with "abc".
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `templateId` is empty.
     */
    async generate(templateId = '', _format = 'PDF', transactionId = '', fillData=null) {
        if(!fillData)
            fillData = {}

        let payload = {
            'format': _format,
        }
        if(templateId === '') {
            throw new InvalidArgumentException('Template ID required.')
        }
        payload['templateId'] = templateId
        if(transactionId !== '') {
            payload['transactionId'] = transactionId
        }

        if(Object.keys(fillData).length > 0) {
            payload['fillData'] = fillData
        }

        let resp = await this.http.post(GetEndpoint('generate'), payload, {
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Retrieve a list of contract templates
     *
     * @param {number} [order=-1] Sort results by newest(-1) or oldest(1).
     * @param {number} [limit=10] Number of items to be returned per call.
     * @param {number} [offset=0] Start the list from a particular entry index.
     * @param {string} [filterTemplateId=""] Filter result by template ID.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `order` is not 1 or -1, or `limit` is out of range.
     */
    async listTemplate(order = -1, limit = 10, offset = 0, filterTemplateId = "") {
        if(order !== -1 && order !== 1) {
            throw new InvalidArgumentException("'order' should be integer of 1 or -1.")
        }

        if(limit <= 0 && limit >= 100) {
            throw new InvalidArgumentException("'limit' should be a positive integer greater than 0 and less than or equal to 100.")
        }
        let payload = {
            "order": order,
            "limit": limit,
            "offset": offset,
        }
        if(filterTemplateId !== "") {
            payload['templateId'] = filterTemplateId
        }
        let resp = await this.http.get(GetEndpoint('contract'), {
            params: payload,
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Get contract template
     *
     * @param {string} [templateId=""] Template ID.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `templateId` is empty.
     */
    async getTemplate(templateId = "") {
        if(templateId === '') {
            throw new InvalidArgumentException('Template ID required.')
        }

        let resp = await this.http.get(GetEndpoint(`contract/${templateId}`), {
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Delete contract template
     *
     * @param {string} [templateId=""] Template ID.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `templateId` is empty.
     */
    async deleteTemplate(templateId = "") {
        if(templateId === '') {
            throw new InvalidArgumentException('Template ID required.')
        }
        let resp = await this.http.delete(GetEndpoint(`contract/${templateId}`), {
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Create new contract template
     *
     * @param {string} [name=""] Template name.
     * @param {string} [content=""] Template HTML content.
     * @param {string} [orientation="0"] Page orientation: 0=Portrait(Default), 1=Landscape.
     * @param {string} [timezone="UTC"] Template timezone.
     * @param {string} [font="Open Sans"] Template font.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `name` or `content` is empty.
     */
    async createTemplate(name = "", content = "", orientation = "0", timezone = "UTC", font = "Open Sans") {
        if(name === '') {
            throw new InvalidArgumentException('Template name required.')
        }
        if(content === '') {
            throw new InvalidArgumentException('Template content required.')
        }
        let payload = {
            "name": name,
            "content": content,
            "orientation": orientation,
            "timezone": timezone,
            "font": font,
        }

        let resp = await this.http.post(GetEndpoint('contract'), payload, {
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Update contract template
     *
     * @param {string} [templateId=""] Template ID.
     * @param {string} [name=""] Template name.
     * @param {string} [content=""] Template HTML content.
     * @param {string} [orientation="0"] Page orientation: 0=Portrait(Default), 1=Landscape.
     * @param {string} [timezone="UTC"] Template timezone.
     * @param {string} [font="Open Sans"] Template font.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `templateId`, `name`, or `content` is empty.
     */
    async updateTemplate(templateId = "", name = "", content = "", orientation = "0", timezone = "UTC", font = "Open Sans") {
        if(templateId === "") {
            throw new InvalidArgumentException("Template ID required.")
        }
        if(name === "") {
            throw new InvalidArgumentException("Template name required.")
        }
        if(content === "") {
            throw new InvalidArgumentException("Template content required.")
        }
        let payload = {
            "name": name,
            "content": content,
            "orientation": orientation,
            "timezone": timezone,
            "font": font,
        }
        let resp = await this.http.post(GetEndpoint(`contract/${templateId}`), payload, {
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }
}

/**
 * Scanner API client. Initiates identity document scans (full KYC scan, plus
 * quick/very-quick OCR-only variants), and configures verification, document
 * restrictions and contract generation for the scan.
 *
 * @augments _ApiParent
 */
class Scanner extends _ApiParent {
    /**
     * Create a new Scanner API client.
     *
     * @param {string|null} [apiKey=null] Your API key. If omitted, the
     *   `IDANALYZER_KEY` environment variable is used.
     */
    constructor(apiKey = null) {
        super(apiKey);
        this.config = Object.assign(this.config, {
            "document": "",
            "documentBack": "",
            "face": "",
            "faceVideo": "",
            "profile": "",
            "profileOverride": {},
            "verifyName": "",
            "verifyDob": "",
            "verifyAge": "",
            "verifyAddress": "",
            "verifyPostcode": "",
            "verifyDocumentNumber": "",
            "restrictCountry": "",
            "restrictState": "",
            "restrictType": "",
            "ip": "",
            "customData": "",
        })
    }

    /**
     * Pass in user IP address to check if ID is issued from the same country as the IP address, if no value is provided http connection IP will be used.
     *
     * @param {string} ip User IP address. If empty, the HTTP connection IP is used.
     * @returns {void}
     */
    setUserIp(ip) {
        this.config['ip'] = ip
    }

    /**
     * Set an arbitrary string you wish to save with the transaction. e.g Internal customer reference number
     *
     * @param {string} customData Arbitrary string to store alongside the transaction.
     * @returns {void}
     */
    setCustomData(customData) {
        this.config['customData'] = customData
    }

    /**
     * Automatically generate contract document using value parsed from uploaded ID
     *
     * @param {string} [templateId=""] Up to 5 contract template IDs (separated by comma). Pass an empty string to disable contract generation.
     * @param {string} [_format="PDF"] Output format: PDF, DOCX or HTML.
     * @param {Object<string, *>|null} [extraFillData=null] Key-value pairs to autofill dynamic fields. Data from the user ID is used first in case of a conflict. For example, passing `{"myparameter":"abc"}` would fill `%{myparameter}` in the contract template with "abc".
     * @returns {void}
     */
    setContractOptions(templateId = "", _format = "PDF", extraFillData = null) {
        if(!extraFillData) {
            extraFillData = {}
        }
        if(templateId !== "") {
            this.config['contractGenerate'] = templateId
            this.config['contractFormat'] = _format
            if(Object.keys(extraFillData).length > 0) {
                this.config['contractPrefill'] = extraFillData
            } else {
                delete this.config['contractPrefill']
            }
        } else {
            delete this.config['contractGenerate']
            delete this.config['contractFormat']
            delete this.config['contractPrefill']
        }
    }

    /**
     * Set KYC Profile
     *
     * @param {Profile} profile KYC {@link Profile} object.
     * @returns {void}
     * @throws {InvalidArgumentException} If `profile` is not a {@link Profile} instance.
     */
    setProfile(profile) {
        if(profile instanceof Profile) {
            this.config['profile'] = profile.profileId
            if(Object.keys(profile.profileOverride).length > 0) {
                this.config['profileOverride'] = profile.profileOverride
            } else {
                delete this.config['profileOverride']
            }
        } else {
            throw new InvalidArgumentException("Provided profile is not a 'KYCProfile' object.")
        }
    }

    /**
     * Check if customer information matches with uploaded document
     *
     * @param {string} [documentNumber=""] Document or ID number.
     * @param {string} [fullName=""] Full name.
     * @param {string} [dob=""] Date of birth in YYYY/MM/DD.
     * @param {string} [ageRange=""] Age range, example: 18-40.
     * @param {string} [address=""] Address.
     * @param {string} [postcode=""] Postcode.
     * @returns {void}
     * @throws {InvalidArgumentException} If `dob` is not in YYYY/MM/DD format or `ageRange` is not in minAge-maxAge format.
     */
    verifyUserInformation(documentNumber = "", fullName = "", dob = "", ageRange = "",
                          address = "", postcode = "") {
        this.config['verifyDocumentNumber'] = documentNumber
        this.config['verifyName'] = fullName
        if(dob === "") {
            this.config['verifyDob'] = dob
        } else {
            let dobReg = /^\d{4}\/\d{2}\/\d{2}$/
            let t = new Date(dob)
            if(dobReg.test(dob) && !isNaN(t.getTime())) {
                this.config['verifyDob'] = dob
            } else {
                throw new InvalidArgumentException('Invalid birthday format (YYYY/MM/DD)')
            }
        }
        if(ageRange === "") {
            this.config['verifyAge'] = ageRange
        } else {
            let ageVerifyReg = /^\d+-\d+$/
            if(!ageVerifyReg.test(ageRange)) {
                throw new InvalidArgumentException('Invalid age range format (minAge-maxAge)')
            }
            this.config['verifyAge'] = ageRange
        }
        this.config['verifyAddress'] = address
        this.config['verifyPostcode'] = postcode
    }

    /**
     * Check if the document was issued by specified countries. Separate multiple values with comma. For example "US,CA" would accept documents from the United States and Canada.
     *
     * @param {string} [countryCodes="US,CA,UK"] ISO ALPHA-2 Country Code separated by comma.
     * @returns {void}
     */
    restrictCountry(countryCodes="US,CA,UK") {
        this.config['restrictCountry'] = countryCodes
    }

    /**
     * Check if the document was issued by specified state. Separate multiple values with comma. For example "CA,TX" would accept documents from California and Texas.
     *
     * @param {string} [states='CA,TX'] State full name or abbreviation separated by comma.
     * @returns {void}
     */
    restrictState(states = 'CA,TX') {
        this.config['restrictState'] = states
    }

    /**
     * Check if the document was one of the specified types. For example, "PD" would accept both passport and driver license.
     *
     * @param {string} [documentType='DIP'] P: Passport, D: Driver's License, I: Identity Card.
     * @returns {void}
     */
    restrictType(documentType = 'DIP') {
        this.config['restrictType'] = documentType
    }

    /**
     * Initiate a new identity document scan & ID face verification transaction by providing input images.
     *
     * @param {string} [documentFront=""] Front of Document (file path, base64 content, URL, or cache reference).
     * @param {string} [documentBack=""] Back of Document (file path, base64 content or URL, or cache reference).
     * @param {string} [facePhoto=""] Face Photo (file path, base64 content or URL, or cache reference). Provide either this or `faceVideo`.
     * @param {string} [faceVideo=""] Face Video (file path, base64 content or URL). Used if `facePhoto` is empty.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If no profile is configured or `documentFront` is empty.
     */
    async scan(documentFront = "", documentBack = "", facePhoto = "", faceVideo = "") {
        if(this.config['profile'] === '') {
            throw new InvalidArgumentException("KYC Profile not configured, please use setProfile before calling this function.")
        }
        let payload = this.config
        if(documentFront === "") {
            throw new InvalidArgumentException("Primary document image required.")
        }
        payload['document'] = ParseInput(documentFront, true)

        if(documentBack !== "") {
            payload['documentBack'] = ParseInput(documentBack, true)
        }

        if(facePhoto !== "") {
            payload['face'] = ParseInput(facePhoto, true)
        } else if(faceVideo !== "") {
            payload['faceVideo'] = ParseInput(faceVideo)
        }

        let resp = await this.http.post(GetEndpoint('scan'), payload, {
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Initiate a quick identity document OCR scan by providing input images.
     *
     * @param {string} [documentFront=""] Front of Document (file path, base64 content or URL).
     * @param {string} [documentBack=""] Back of Document (file path, base64 content or URL).
     * @param {boolean} [cacheImage=false] Cache uploaded image(s) for 24 hours and obtain a cache reference for each image; the reference hash can be used to start a standard scan transaction without re-uploading the file.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `documentFront` is empty.
     */
    async quickScan(documentFront = "", documentBack = "", cacheImage = false) {
        let payload = {
            'saveFile': cacheImage,
        }
        if(documentFront === "") {
            throw new InvalidArgumentException("Primary document image required.")
        }
        payload['document'] = ParseInput(documentFront)

        if(documentBack !== "") {
            payload['documentBack'] = ParseInput(documentBack)
        }
        let resp = await this.http.post(GetEndpoint('quickscan'), payload, {
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Initiate a very quick (fast) identity document OCR scan by providing input images. Faster but less
     * thorough than quickScan, useful for high-throughput OCR-only use cases.
     *
     * @param {string} [documentFront=""] Front of Document (file path, base64 content or URL).
     * @param {string} [documentBack=""] Back of Document (file path, base64 content or URL).
     * @param {boolean} [cacheImage=false] Cache uploaded image(s) for 24 hours and obtain a cache reference for each image; the reference hash can be used to start a standard scan transaction without re-uploading the file.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `documentFront` is empty.
     */
    async veryQuickScan(documentFront = "", documentBack = "", cacheImage = false) {
        let payload = {
            'saveFile': cacheImage,
        }
        if(documentFront === "") {
            throw new InvalidArgumentException("Primary document image required.")
        }
        payload['document'] = ParseInput(documentFront)

        if(documentBack !== "") {
            payload['documentBack'] = ParseInput(documentBack)
        }
        let resp = await this.http.post(GetEndpoint('veryquickscan'), payload, {
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }
}

/**
 * Transaction API client. Retrieves, lists, updates and deletes transaction
 * records, and downloads transaction images, files and archive exports.
 *
 * @augments _ApiParent
 */
class Transaction extends _ApiParent {
    /**
     * Create a new Transaction API client.
     *
     * @param {string|null} [apiKey=null] Your API key. If omitted, the
     *   `IDANALYZER_KEY` environment variable is used.
     */
    constructor(apiKey=null) {
        super(apiKey);
    }

    /**
     * Retrieve a single transaction record
     *
     * @param {string} [transactionId=""] Transaction ID.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `transactionId` is empty.
     */
    async getTransaction(transactionId = "") {
        if(transactionId === "") {
            throw new InvalidArgumentException("Transaction ID required.")
        }
        let resp = await this.http.get(GetEndpoint(`transaction/${transactionId}`), {
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Retrieve a list of transaction history
     *
     * @param {number} [order=-1] Sort results by newest(-1) or oldest(1).
     * @param {number} [limit=10] Number of items to be returned per call.
     * @param {number} [offset=0] Start the list from a particular entry index.
     * @param {number} [createdAtMin=0] List transactions that were created after this UNIX timestamp.
     * @param {number} [createdAtMax=0] List transactions that were created before this UNIX timestamp.
     * @param {string} [filterCustomData=""] Filter result by customData field.
     * @param {string} [filterDecision=""] Filter result by decision (accept, review, reject).
     * @param {string} [filterDocupass=""] Filter result by Docupass reference.
     * @param {string} [filterProfileId=""] Filter result by KYC Profile ID.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `order` is not 1 or -1, or `limit` is out of range.
     */
    async listTransaction(order = -1, limit = 10, offset = 0, createdAtMin = 0,
                          createdAtMax = 0, filterCustomData = "", filterDecision = "",
                          filterDocupass = "", filterProfileId = "") {
        if(order !== -1 && order !== 1) {
            throw new InvalidArgumentException("'order' should be integer of 1 or -1.")
        }
        if(limit <= 0 || limit >= 100) {
            throw new InvalidArgumentException("'limit' should be a positive integer greater than 0 and less than or equal to 100.")
        }
        let payload = {
            "order": order,
            "limit": limit,
            "offset": offset,
        }
        if(createdAtMin > 0) {
            payload['createdAtMin'] = createdAtMin
        }
        if(createdAtMax > 0) {
            payload['createdAtMax'] = createdAtMax
        }

        if(filterCustomData !== "") {
            payload['customData'] = filterCustomData
        }
        if(filterDocupass !== "") {
            payload['docupass'] = filterDocupass
        }
        if(filterDecision !== "") {
            payload['decision'] = filterDecision
        }
        if(filterProfileId !== "") {
            payload['profileId'] = filterProfileId
        }

        let resp = await this.http.get(GetEndpoint('transaction'), {
            params: payload,
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Update transaction decision, updated decision will be relayed to webhook if set.
     *
     * @param {string} [transactionId=""] Transaction ID.
     * @param {string} [decision=""] New decision (accept, review or reject).
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `transactionId` is empty or `decision` is not one of accept/review/reject.
     */
    async updateTransaction(transactionId = "", decision = "") {
        if(transactionId === "") {
            throw new InvalidArgumentException('Transaction ID required.')
        }
        if(['accept', 'review', 'reject'].indexOf(decision) === -1) {
            throw new InvalidArgumentException("'decision' should be either accept, review or reject.")
        }

        let resp = await this.http.patch(GetEndpoint(`transaction/${transactionId}`), {
            'decision': decision,
        }, {timeout: 60000})
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Delete a transaction
     *
     * @param {string} [transactionId=""] Transaction ID.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `transactionId` is empty.
     */
    async deleteTransaction(transactionId = "") {
        if(transactionId === "") {
            throw new InvalidArgumentException('Transaction ID required.')
        }
        let resp = await this.http.delete(GetEndpoint(`transaction/${transactionId}`), {
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Download transaction image onto local file system
     *
     * @param {string} [imageToken=""] Image token from the transaction API response.
     * @param {string} [destination=""] Full destination path including file name; the file extension should be jpg, for example: '\home\idcard.jpg'.
     * @returns {Promise<void>} Resolves once the download stream has been piped to disk.
     * @throws {InvalidArgumentException} If `imageToken` or `destination` is empty.
     */
    async saveImage(imageToken = "", destination = "") {
        if(imageToken === "") {
            throw new InvalidArgumentException("'imageToken' required.")
        }
        if(destination === "") {
            throw new InvalidArgumentException("'destination' required.")
        }
        let resp = await this.http.get(GetEndpoint(`imagevault/${imageToken}`), {
            timeout: 60000,
            responseType: 'stream',
        })
        resp.data.pipe(fs.createWriteStream(destination))
    }

    /**
     * Download transaction file onto local file system using secured file name obtained from transaction
     *
     * @param {string} [fileName=""] Secured file name obtained from the transaction.
     * @param {string} [destination=""] Full destination path including file name, for example: '\home\auditreport.pdf'.
     * @returns {Promise<void>} Resolves once the download stream has been piped to disk.
     * @throws {InvalidArgumentException} If `fileName` or `destination` is empty.
     */
    async saveFile(fileName = "", destination = "") {
        if (fileName === "")
            throw new InvalidArgumentException("'fileName' required.")
        if (destination === "")
            throw new InvalidArgumentException("'destination' required.")

        let resp = await this.http.get(GetEndpoint(`filevault/${fileName}`), {
            timeout: 60000,
            responseType: 'stream',
        })
        resp.data.pipe(fs.createWriteStream(destination))
    }

    /**
     * Download transaction archive onto local file system
     *
     * @param {string} [destination=""] Full destination path including file name; the file extension should be zip, for example: '\home\archive.zip'.
     * @param {string[]|null} [transactionId=null] Export only the specified transaction IDs. Pass `null` to export all matching transactions.
     * @param {string} [exportType="csv"] Export format, either 'csv' or 'json'.
     * @param {boolean} [ignoreUnrecognized=false] Ignore unrecognized documents.
     * @param {boolean} [ignoreDuplicate=false] Ignore duplicated entries.
     * @param {number} [createdAtMin=0] Export only transactions that were created after this UNIX timestamp.
     * @param {number} [createdAtMax=0] Export only transactions that were created before this UNIX timestamp.
     * @param {string} [filterCustomData=""] Filter export by customData field.
     * @param {string} [filterDecision=""] Filter export by decision (accept, review, reject).
     * @param {string} [filterDocupass=""] Filter export by Docupass reference.
     * @param {string} [filterProfileId=""] Filter export by KYC Profile ID.
     * @returns {Promise<void>} Resolves once the export archive has been downloaded and piped to disk (if the API returned a download URL).
     * @throws {InvalidArgumentException} If `destination` is empty or `exportType` is not 'csv' or 'json'.
     */
    async exportTransaction(destination = "", transactionId = null, exportType = "csv", ignoreUnrecognized = false,
                            ignoreDuplicate = false, createdAtMin = 0,
                            createdAtMax = 0, filterCustomData = "", filterDecision = "",
                            filterDocupass = "", filterProfileId = "") {
        if(transactionId === null) {
            transactionId = []
        }
        if(destination === '') {
            throw new InvalidArgumentException("'destination' required.")
        }
        if(['csv', 'json'].indexOf(exportType) === -1) {
            throw new InvalidArgumentException("'exportType' should be either 'json' or 'csv'.")
        }
        let payload = {
            "exportType": exportType,
            "ignoreUnrecognized": ignoreUnrecognized,
            "ignoreDuplicate": ignoreDuplicate,
        }
        if(transactionId.length > 0) {
            payload['transactionId'] = transactionId
        }
        if(createdAtMin > 0) {
            payload['createdAtMin'] = createdAtMin
        }
        if(createdAtMax > 0) {
            payload['createdAtMax'] = createdAtMax
        }
        if(filterCustomData !== '') {
            payload['customData'] = filterCustomData
        }
        if(filterDocupass !== '') {
            payload['docupass'] = filterDocupass
        }
        if(filterDecision !== '') {
            payload['decision'] = filterDecision
        }
        if(filterProfileId !== '') {
            payload['profileId'] = filterProfileId
        }

        let resp = await this.http.post(GetEndpoint('export/transaction'), payload, {
            timeout: 300000,
        })
        if(resp.data?.Url) {
            let resp2 = await this.http.get(GetEndpoint(resp.data.Url), {
                timeout: 300000,
                responseType: 'stream',
            })
            resp2.data.pipe(fs.createWriteStream(destination))
        }
    }
}

/**
 * Docupass API client. Creates, lists, retrieves and deletes Docupass
 * verification sessions (hosted ID verification links/forms).
 *
 * @augments _ApiParent
 */
class Docupass extends _ApiParent {
    /**
     * Create a new Docupass API client.
     *
     * @param {string|null} [apiKey=null] Your API key. If omitted, the
     *   `IDANALYZER_KEY` environment variable is used.
     */
    constructor(apiKey = null) {
        super(apiKey);
    }

    /**
     * Retrieve a list of Docupass sessions.
     *
     * @param {number} [order=-1] Sort results by newest(-1) or oldest(1).
     * @param {number} [limit=10] Number of items to be returned per call.
     * @param {number} [offset=0] Start the list from a particular entry index.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `order` is not 1 or -1, or `limit` is out of range.
     */
    async listDocupass(order = -1, limit = 10, offset = 0) {
        if(order !== 1 && order !== -1) {
            throw new InvalidArgumentException("'order' should be integer of 1 or -1.")
        }

        if(limit <= 0 || limit >= 100) {
            throw new InvalidArgumentException("'limit' should be a positive integer greater than 0 and less than or equal to 100.")
        }

        let payload = {
            "order": order,
            "limit": limit,
            "offset": offset,
        }
        let resp = await this.http.get(GetEndpoint('docupass'), {
            params: payload,
            timeout: 30000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Retrieve a single Docupass record by reference.
     *
     * @param {string} [reference=''] Docupass reference ID.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `reference` is empty.
     */
    async getDocupass(reference = '') {
        if(reference === '') {
            throw new InvalidArgumentException("'reference' is required.")
        }
        let resp = await this.http.get(GetEndpoint(`docupass/${reference}`), {
            timeout: 30000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Create a new Docupass verification session.
     *
     * @param {string|null} [profile=null] KYC Profile ID to apply to the verification. Required.
     * @param {number} [mode=0] Docupass verification mode (e.g. 0=document + face, see API docs for available modes).
     * @param {string} [contractFormat='pdf'] Generated contract format: 'pdf', 'docx' or 'html'.
     * @param {string} [contractGenerate=''] Contract template ID(s) to auto-generate on completion.
     * @param {boolean} [reusable=false] Whether the Docupass link can be reused by multiple users.
     * @param {string} [contractPrefill=''] Key-value data used to prefill the generated contract.
     * @param {string} [contractSign=''] Contract signing configuration.
     * @param {string} [customData=''] Arbitrary string to store alongside the resulting transaction.
     * @param {string} [language=''] Display language for the Docupass page (e.g. 'en').
     * @param {string|null} [referenceDocument=null] Reference document front image to verify against.
     * @param {string|null} [referenceDocumentBack=null] Reference document back image to verify against.
     * @param {string|null} [referenceFace=null] Reference face image to verify against.
     * @param {string} [userPhone=''] User phone number.
     * @param {string} [verifyAddress=''] Address to verify against the submitted document.
     * @param {string} [verifyAge=''] Age range (e.g. "18-99") to verify against the submitted document.
     * @param {string} [verifyDOB=''] Date of birth (YYYY/MM/DD) to verify against the submitted document.
     * @param {string} [verifyDocumentNumber=''] Document/ID number to verify against the submitted document.
     * @param {string} [verifyName=''] Full name to verify against the submitted document.
     * @param {string} [verifyPostcode=''] Postcode to verify against the submitted document.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `profile` is `null`.
     */
    async createDocupass(profile=null, mode=0, contractFormat='pdf', contractGenerate='', reusable=false,
                         contractPrefill='',
                         contractSign='', customData='', language='',
                         referenceDocument=null, referenceDocumentBack=null, referenceFace=null,
                         userPhone='', verifyAddress='', verifyAge='', verifyDOB='',
                         verifyDocumentNumber='', verifyName='', verifyPostcode='') {
        if(profile === null) {
            throw new InvalidArgumentException('Profile is required.')
        }
        let payload = {
            'mode': mode,
            'profile': profile,
            'contractFormat': contractFormat,
            'contractGenerate': contractGenerate,
            'reusable': reusable,
        }
        if (contractPrefill !== '' && contractPrefill !== null)
            payload['contractPrefill'] = contractPrefill
        if (contractSign !== '' && contractSign !== null)
            payload['contractSign'] = contractSign
        if (customData !== '' && customData !== null)
            payload['customData'] = customData
        if (language !== '' && language !== null)
            payload['language'] = language
        if (referenceDocument !== '' && referenceDocument !== null)
            payload['referenceDocument'] = referenceDocument
        if (referenceDocumentBack !== '' && referenceDocumentBack !== null)
            payload['referenceDocumentBack'] = referenceDocumentBack
        if (referenceFace !== '' && referenceFace !== null)
            payload['referenceFace'] = referenceFace
        if (userPhone !== '' && userPhone !== null)
            payload['userPhone'] = userPhone
        if (verifyAddress !== '' && verifyAddress !== null)
            payload['verifyAddress'] = verifyAddress
        if (verifyAge !== '' && verifyAge !== null)
            payload['verifyAge'] = verifyAge
        if (verifyDOB !== '' && verifyDOB !== null)
            payload['verifyDOB'] = verifyDOB
        if (verifyDocumentNumber !== '' && verifyDocumentNumber !== null)
            payload['verifyDocumentNumber'] = verifyDocumentNumber
        if (verifyName !== '' && verifyName !== null)
            payload['verifyName'] = verifyName
        if (verifyPostcode !== '' && verifyPostcode !== null)
            payload['verifyPostcode'] = verifyPostcode

        let resp = await this.http.post(GetEndpoint('docupass'), payload, {
            timeout: 30000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Delete a Docupass session by reference.
     *
     * @param {string} [reference=''] Docupass reference ID.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `reference` is empty.
     */
    async deleteDocupass(reference='') {
        if(reference === '') {
            throw new InvalidArgumentException("'reference' is required.")
        }
        let resp = await this.http.delete(GetEndpoint(`docupass/${reference}`), {
            timeout: 30000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }
}


/**
 * AML (Anti-Money-Laundering) API client. Searches sanction, PEP and watchlist
 * databases via the v1 and v3 search endpoints.
 *
 * @augments _ApiParent
 */
class AML extends _ApiParent {
    /**
     * Create a new AML API client.
     *
     * @param {string|null} [apiKey=null] Your API key. If omitted, the
     *   `IDANALYZER_KEY` environment variable is used.
     */
    constructor(apiKey = null) {
        super(apiKey);
    }

    /**
     * Search the AML database (v1 endpoint).
     *
     * @param {string} [name=""] Search AML database with a person's name or business name.
     * @param {string} [idNumber=""] Search AML database with a document number.
     * @param {number} [entity=0] Entity type: 0=Person, 1=Corporation/Legal Entity.
     * @param {string} [country=""] Two-digit ISO country code to filter by country/nationality.
     * @param {string[]|null} [database=null] Optional array of databases to search, e.g. ["us_ofac","eu_fsf"]. If omitted, all databases are searched.
     * @param {string} [birthYear=""] Filter by year of birth.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If both `name` and `idNumber` are empty.
     */
    async search(name = "", idNumber = "", entity = 0, country = "", database = null, birthYear = "") {
        if(name === "" && idNumber === "") {
            throw new InvalidArgumentException("Either 'name' or 'idNumber' is required.")
        }
        let payload = {'entity': entity}
        if(name !== "") payload['name'] = name
        if(idNumber !== "") payload['idNumber'] = idNumber
        if(country !== "") payload['country'] = country
        if(birthYear !== "") payload['birthYear'] = birthYear
        if(database && database.length > 0) payload['database'] = database

        let resp = await this.http.post(GetEndpoint('aml'), payload, {timeout: 30000})
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Search the AML database (v3 endpoint). Provide either a free-text query or one or more entity IDs.
     *
     * @param {string} [text=""] Full-text query (name, alias, document/passport/tax/registration number, etc.).
     * @param {string} [id=""] One or more AML entity IDs separated by comma or newline (max 50).
     * @param {number} [limit=0] Number of results to return per page. 0 uses the API default.
     * @param {number} [page=0] Result page number. 0 uses the API default.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If both `text` and `id` are empty.
     */
    async searchV3(text = "", id = "", limit = 0, page = 0) {
        if(text === "" && id === "") {
            throw new InvalidArgumentException("Either 'text' or 'id' is required.")
        }
        let payload = {}
        if(text !== "") payload['text'] = text
        if(id !== "") payload['id'] = id
        if(limit > 0) payload['limit'] = limit
        if(page > 0) payload['page'] = page

        let resp = await this.http.post(GetEndpoint('amlv3'), payload, {timeout: 30000})
        return ApiExceptionHandle(resp.data, this.throwError)
    }
}

/**
 * Profile API client. Manages stored KYC profiles on your account
 * (list, retrieve, create, update, delete and export).
 *
 * @augments _ApiParent
 */
class ProfileAPI extends _ApiParent {
    /**
     * Create a new Profile API client.
     *
     * @param {string|null} [apiKey=null] Your API key. If omitted, the
     *   `IDANALYZER_KEY` environment variable is used.
     */
    constructor(apiKey = null) {
        super(apiKey);
    }

    /**
     * Build the request body for create/update profile calls from a name and a
     * {@link Profile} object or plain config object.
     *
     * @private
     * @param {string} name Profile name (omitted from the body if empty).
     * @param {Profile|Object<string, *>|null} profile A {@link Profile} instance (its overrides are used) or a plain config object.
     * @returns {Object<string, *>} The assembled request body.
     * @throws {InvalidArgumentException} If `profile` is provided but is neither a {@link Profile} nor a plain object.
     */
    static _profileBody(name, profile) {
        let body = {}
        if(name !== "") body['name'] = name
        if(profile) {
            if(profile instanceof Profile) {
                Object.assign(body, profile.profileOverride)
            } else if(typeof profile === 'object') {
                Object.assign(body, profile)
            } else {
                throw new InvalidArgumentException("'profile' should be a Profile object or plain object.")
            }
        }
        return body
    }

    /**
     * List KYC profiles.
     *
     * @param {number} [order=-1] Sort results by newest(-1) or oldest(1).
     * @param {number} [limit=10] Number of items to be returned per call.
     * @param {number} [offset=0] Start the list from a particular entry index.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `order` is not 1 or -1.
     */
    async listProfile(order = -1, limit = 10, offset = 0) {
        if(order !== -1 && order !== 1) {
            throw new InvalidArgumentException("'order' should be integer of 1 or -1.")
        }
        let resp = await this.http.get(GetEndpoint('profile'), {
            params: {order, limit, offset},
            timeout: 30000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Retrieve a single KYC profile.
     *
     * @param {string} [profileId=""] KYC profile ID.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `profileId` is empty.
     */
    async getProfile(profileId = "") {
        if(profileId === "") throw new InvalidArgumentException("'profileId' required.")
        let resp = await this.http.get(GetEndpoint(`profile/${profileId}`), {timeout: 30000})
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Create a new KYC profile.
     *
     * @param {string} [name=""] Profile name.
     * @param {Profile|Object<string, *>|null} [profile=null] A {@link Profile} object (its overrides become the profile config) or a plain object.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `name` is empty, or `profile` is an unsupported type.
     */
    async createProfile(name = "", profile = null) {
        if(name === "") throw new InvalidArgumentException("Profile name required.")
        let resp = await this.http.post(GetEndpoint('profile'), ProfileAPI._profileBody(name, profile), {timeout: 30000})
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Update an existing KYC profile.
     *
     * @param {string} [profileId=""] KYC profile ID.
     * @param {string} [name=""] New profile name.
     * @param {Profile|Object<string, *>|null} [profile=null] A {@link Profile} object (its overrides become the profile config) or a plain object.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `profileId` is empty, or `profile` is an unsupported type.
     */
    async updateProfile(profileId = "", name = "", profile = null) {
        if(profileId === "") throw new InvalidArgumentException("'profileId' required.")
        let resp = await this.http.put(GetEndpoint(`profile/${profileId}`), ProfileAPI._profileBody(name, profile), {timeout: 30000})
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Delete a KYC profile.
     *
     * @param {string} [profileId=""] KYC profile ID.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `profileId` is empty.
     */
    async deleteProfile(profileId = "") {
        if(profileId === "") throw new InvalidArgumentException("'profileId' required.")
        let resp = await this.http.delete(GetEndpoint(`profile/${profileId}`), {timeout: 30000})
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Export a KYC profile (GET /export/profile/{id}).
     *
     * @param {string} [profileId=""] KYC profile ID.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `profileId` is empty.
     */
    async exportProfile(profileId = "") {
        if(profileId === "") throw new InvalidArgumentException("'profileId' required.")
        let resp = await this.http.get(GetEndpoint(`export/profile/${profileId}`), {timeout: 60000})
        return ApiExceptionHandle(resp.data, this.throwError)
    }
}

/**
 * Webhook API client. Lists webhook delivery logs and allows resending or
 * deleting individual delivery records.
 *
 * @augments _ApiParent
 */
class Webhook extends _ApiParent {
    /**
     * Create a new Webhook API client.
     *
     * @param {string|null} [apiKey=null] Your API key. If omitted, the
     *   `IDANALYZER_KEY` environment variable is used.
     */
    constructor(apiKey = null) {
        super(apiKey);
    }

    /**
     * List webhook delivery logs.
     *
     * @param {number} [order=-1] Sort results by newest(-1) or oldest(1).
     * @param {number} [limit=10] Number of items to be returned per call.
     * @param {number} [offset=0] Start the list from a particular entry index.
     * @param {string} [event=""] Filter by event type.
     * @param {number} [success=-1] Filter by delivery success: 1=success, 0=failure, -1=no filter.
     * @param {string} [createdAtMin=""] List deliveries created after this timestamp.
     * @param {string} [createdAtMax=""] List deliveries created before this timestamp.
     * @returns {Promise<ApiResponse>} The parsed API response.
     */
    async listWebhook(order = -1, limit = 10, offset = 0, event = "", success = -1, createdAtMin = "", createdAtMax = "") {
        let payload = {order, limit, offset}
        if(event !== "") payload['event'] = event
        if(success === 0 || success === 1) payload['success'] = success
        if(createdAtMin !== "") payload['createdAtMin'] = createdAtMin
        if(createdAtMax !== "") payload['createdAtMax'] = createdAtMax
        let resp = await this.http.get(GetEndpoint('webhook'), {params: payload, timeout: 30000})
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Resend a webhook delivery.
     *
     * @param {string} [webhookId=""] Webhook delivery ID.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `webhookId` is empty.
     */
    async resendWebhook(webhookId = "") {
        if(webhookId === "") throw new InvalidArgumentException("'webhookId' required.")
        let resp = await this.http.post(GetEndpoint(`webhook/${webhookId}`), {}, {timeout: 30000})
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Delete a webhook delivery log.
     *
     * @param {string} [webhookId=""] Webhook delivery ID.
     * @returns {Promise<ApiResponse>} The parsed API response.
     * @throws {InvalidArgumentException} If `webhookId` is empty.
     */
    async deleteWebhook(webhookId = "") {
        if(webhookId === "") throw new InvalidArgumentException("'webhookId' required.")
        let resp = await this.http.delete(GetEndpoint(`webhook/${webhookId}`), {timeout: 30000})
        return ApiExceptionHandle(resp.data, this.throwError)
    }
}

/**
 * Account API client. Retrieves the current account's profile, quota and usage.
 *
 * @augments _ApiParent
 */
class Account extends _ApiParent {
    /**
     * Create a new Account API client.
     *
     * @param {string|null} [apiKey=null] Your API key. If omitted, the
     *   `IDANALYZER_KEY` environment variable is used.
     */
    constructor(apiKey = null) {
        super(apiKey);
    }

    /**
     * Retrieve current account profile, quota and usage.
     *
     * @returns {Promise<ApiResponse>} The parsed API response containing account profile, quota and usage.
     */
    async getAccount() {
        let resp = await this.http.get(GetEndpoint('myaccount'), {timeout: 30000})
        return ApiExceptionHandle(resp.data, this.throwError)
    }
}

/**
 * Public SDK surface: every API client class plus the {@link SetEndpoint}
 * helper and the {@link APIError} / {@link InvalidArgumentException} error types.
 */
export {Profile, Biometric, Contract, Scanner, Transaction, Docupass, AML, ProfileAPI, Webhook, Account, SetEndpoint, APIError, InvalidArgumentException};
