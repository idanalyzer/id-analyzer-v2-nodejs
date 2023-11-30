import {ApiExceptionHandle, GetEndpoint, ParseInput, SetEndpoint} from "./common.js";

import {APIError, InvalidArgumentException} from './exception.js'
import * as fs from 'fs';
import moment from "moment";
import axios from "axios";
import https from 'https';

class _ApiParent {
    /**
     *
     * @param apiKey You API key
     */
    constructor(apiKey=null) {
        this.apiKey = apiKey
        this.client_library = "nodejs-sdk"
        if(this.apiKey === null) {
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
            withCredentials: true,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            }),
        })
    }

    getApiKey(customKey=null) {
        return customKey ?? process.env.IDANALYZER_KEY
    }

    /**
     * Set an API parameter and its value, this function allows you to set any API parameter without using the built-in functions
     *
     * @param key Parameter key
     * @param value Parameter value
     */
    setParam(key, value) {
        this.config[key] = value
    }

    /**
     * Whether an exception should be thrown if API response contains an error message
     *
     * @param sw
     */
    throwApiException(sw=false) {
        this.throwError = sw
    }
}

class Profile {
    static SECURITY_NONE = "security_none"
    static SECURITY_LOW = "security_low"
    static SECURITY_MEDIUM = "security_medium"
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
     * @param {string} jsonStr JSON string containing profile information.
     */
    loadFromJson(jsonStr = '{}') {
        this.profileOverride = JSON.parse(jsonStr)
    }

    /**
     * Canvas Size in pixels, input image larger than this size will be scaled down before further processing, reduced image size will improve inference time but reduce result accuracy. Set 0 to disable image resizing.
     *
     * @param {number} pixels
     */
    canvasSize(pixels) {
        this.profileOverride['canvasSize'] = pixels
    }

    /**
     * Correct image orientation for rotated images
     *
     * @param {boolean} enabled
     */
    orientationCorrection(enabled) {
        this.profileOverride['orientationCorrection'] = enabled
    }

    /**
     * Enable to automatically detect and return the locations of signature, document and face.
     *
     * @param {boolean} enabled
     */
    objectDetection(enabled) {
        this.profileOverride['objectDetection'] = enabled
    }

    /**
     * Enable to parse AAMVA barcode for US/CA ID/DL. Disable this to improve performance if you are not planning on scanning ID/DL from US or Canada.
     *
     * @param {boolean} enabled
     */
    AAMVABarcodeParsing(enabled) {
        this.profileOverride['AAMVABarcodeParsing'] = enabled
    }

    /**
     * Whether scan transaction results and output images should be saved on cloud
     *
     * @param enableSaveTransaction
     * @param enableSaveTransactionImages
     */
    saveResult(enableSaveTransaction, enableSaveTransactionImages) {
        this.profileOverride['saveResult'] = enableSaveTransaction
        if(enableSaveTransactionImages)
            this.profileOverride['saveImage'] = enableSaveTransactionImages
    }

    /**
     * Whether to return output image as part of API response
     *
     * @param enableOutputImage
     * @param outputFormat
     */
    outputImage(enableOutputImage, outputFormat="url") {
        this.profileOverride['outputImage'] = enableOutputImage
        if(enableOutputImage)
            this.profileOverride['outputType'] = outputFormat
    }

    /**
     * Crop image before saving and returning output
     *
     * @param enableAutoCrop
     * @param enableAdvancedAutoCrop
     */
    autoCrop(enableAutoCrop, enableAdvancedAutoCrop) {
        this.profileOverride['crop'] = enableAutoCrop
        this.profileOverride['advancedCrop'] = enableAdvancedAutoCrop
    }

    /**
     * Maximum width/height in pixels for output and saved image.
     *
     * @param pixels
     */
    outputSize(pixels) {
        this.profileOverride['outputSize'] = pixels
    }

    /**
     * Generate a full name field using parsed first name, middle name and last name.
     *
     * @param enabled
     */
    inferFullName(enabled) {
        this.profileOverride['inferFullName'] = enabled
    }

    /**
     * If first name contains more than one word, move second word onwards into middle name field.
     *
     * @param enabled
     */
    splitFirstName(enabled) {
        this.profileOverride['splitFirstName'] = enabled
    }

    /**
     * Enable to generate a detailed PDF audit report for every transaction.
     *
     * @param enabled
     */
    transactionAuditReport(enabled) {
        this.profileOverride['transactionAuditReport'] = enabled
    }

    /**
     * Set timezone for audit reports. If left blank, UTC will be used. Refer to https://en.wikipedia.org/wiki/List_of_tz_database_time_zones TZ database name list.
     *
     * @param timezone
     */
    setTimezone(timezone) {
        this.profileOverride['timezone'] = timezone
    }

    /**
     * A list of data fields key to be redacted before transaction storage, these fields will also be blurred from output & saved image.
     *
     * @param fieldKeys
     */
    obscure(fieldKeys) {
        this.profileOverride['obscure'] = fieldKeys
    }

    /**
     * Enter a server URL to listen for Docupass verification and scan transaction results
     *
     * @param url
     */
    webhook(url="https://www.example.com/webhook.php") {
        let reg = new RegExp(this.URL_VALIDATION_REGEX)
        let valid = reg.test(url)
        if(!valid) throw new InvalidArgumentException('Invalid URL format')

        let urlinfo = new URL(url)
        if(urlinfo.hostname === 'localhost') {
            throw new InvalidArgumentException('Invalid URL, the host does not appear to be a remote host.')
        }

        if(urlinfo.protocol !== 'http' || urlinfo.protocol !== 'https')
            throw new InvalidArgumentException("Invalid URL, only http and https protocols are allowed.")

        this.profileOverride['webhook'] = url
    }

    /**
     * Set validation threshold of a specified component
     *
     * @param thresholdKey
     * @param thresholdValue
     */
    threshold(thresholdKey, thresholdValue) {
        if (!this.profileOverride['thresholds'])
            this.profileOverride['thresholds'] = {}
        this.profileOverride['thresholds'][thresholdKey] = thresholdValue
    }

    /**
     * Set decision trigger value
     *
     * @param reviewTrigger {number} If the final total review score is equal to or greater than this value, the final KYC decision will be "review"
     * @param rejectTrigger {number} If the final total review score is equal to or greater than this value, the final KYC decision will be "reject". Reject has higher priority than review.
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
     * @param code {string} Document Validation Component Code / Warning Code
     * @param enabled {boolean} Enable the current Document Validation Component
     * @param reviewThreshold {number} If the current validation has failed to pass, and the specified number is greater than or equal to zero, and the confidence of this warning is greater than or equal to the specified value, the "total review score" will be added by the weight value.
     * @param rejectThreshold {number} If the current validation has failed to pass, and the specified number is greater than or equal to zero, and the confidence of this warning is greater than or equal to the specified value, the "total reject score" will be added by the weight value.
     * @param weight {number} Weight to add to the total review and reject score if the validation has failed to pass.
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
     * @param countryCodes {string} ISO ALPHA-2 Country Code separated by comma
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
     * @param states {string} State full name or abbreviation separated by comma
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
     * @param documentType {string} P: Passport, D: Driver's License, I: Identity Card
     */
    restrictDocumentType(documentType = "DIP") {
        if(this.profileOverride['acceptedDocuments']) {
            this.profileOverride['acceptedDocuments'] = {}
        }
        this.profileOverride['acceptedDocuments']['documentType'] = documentType
    }
}

class Biometric extends _ApiParent {
    /**
     *
     * @param apiKey You API key
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
     * @param customData
     */
    setCustomData(customData) {
        this.config['customData'] = customData
    }

    /**
     * Set KYC Profile
     *
     * @param profile KYCProfile object
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
     * @param referenceFaceImage Front of Document (file path, base64 content, url, or cache reference)
     * @param facePhoto Face Photo (file path, base64 content or URL, or cache reference)
     * @param faceVideo Face Video (file path, base64 content or URL)
     * @returns {Promise<*>}
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
     * @param facePhoto Face Photo (file path, base64 content or URL, or cache reference)
     * @param faceVideo Face Video (file path, base64 content or URL)
     * @returns {Promise<*>}
     */
    async verifyLiveness(facePhoto = "", faceVideo = "") {
        if (this.config['profile'] === '') {
            throw new InvalidArgumentException("KYC Profile not configured, please use setProfile before calling this function.")
        }
        let payload = this.config['profile']
        if(facePhoto === '' && faceVideo === '')
            throw new InvalidArgumentException('Verification face image required.')

        if(facePhoto !== '') {
            payload['face'] = ParseInput(facePhoto, true)
        } else if(faceVideo !== '') {
            payload['faceVideo'] = ParseInput(faceVideo)
        }
        let resp = await this.http.post('liveness', payload, {
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }
}

class Contract extends _ApiParent {
    /**
     *
     * @param apiKey You API key
     */
    constructor(apiKey=null) {
        super(apiKey);
    }

    /**
     * Generate document using template and transaction data
     *
     * @param templateId Template ID
     * @param _format PDF, DOCX or HTML
     * @param transactionId Fill the template with data from specified transaction
     * @param {*} fillData - Array data in key-value pairs to autofill dynamic fields, data from user ID will be used first in case of a conflict. For example, passing {"myparameter":"abc"} would fill %{myparameter} in contract template with "abc".
     * @returns {Promise<*>}
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
     * @param order Sort results by newest(-1) or oldest(1)
     * @param limit Number of items to be returned per call
     * @param offset Start the list from a particular entry index
     * @param filterTemplateId Filter result by template ID
     * @returns {Promise<*>}
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
     * @param templateId Template ID
     * @returns {Promise<*>}
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
     * @param templateId Template ID
     * @returns {Promise<*>}
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
     * @param name Template name
     * @param content Template HTML content
     * @param orientation 0=Portrait(Default) 1=Landscape
     * @param timezone Template timezone
     * @param font Template font
     * @returns {Promise<*>}
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
     * @param templateId Template ID
     * @param name Template name
     * @param content Template HTML content
     * @param orientation 0=Portrait(Default) 1=Landscape
     * @param timezone Template timezone
     * @param font Template font
     * @returns {Promise<*>}
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
        console.log(1)
        let resp = await this.http.post(GetEndpoint(`contract/${templateId}`), payload, {
            timeout: 60000,
        })
        console.log(2)
        return ApiExceptionHandle(resp.data, this.throwError)
    }
}

class Scanner extends _ApiParent {
    /**
     *
     * @param apiKey You API key
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
     * @param ip
     */
    setUserIp(ip) {
        this.config['ip'] = ip
    }

    /**
     * Set an arbitrary string you wish to save with the transaction. e.g Internal customer reference number
     *
     * @param customData
     */
    setCustomData(customData) {
        this.config['customData'] = customData
    }

    /**
     * Automatically generate contract document using value parsed from uploaded ID
     *
     * @param templateId Enter up to 5 contract template ID (seperated by comma)
     * @param _format PDF, DOCX or HTML
     * @param {*} extraFillData - Array data in key-value pairs to autofill dynamic fields, data from user ID will be used first in case of a conflict. For example, passing {"myparameter":"abc"} would fill %{myparameter} in contract template with "abc".
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
     * @param profile KYCProfile object
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
     * @param documentNumber Document or ID number
     * @param fullName Full name
     * @param dob Date of birth in YYYY/MM/DD
     * @param ageRange Age range, example: 18-40
     * @param address Address
     * @param postcode Postcode
     */
    verifyUserInformation(documentNumber = "", fullName = "", dob = "", ageRange = "",
                          address = "", postcode = "") {
        this.config['verifyDocumentNumber'] = documentNumber
        this.config['verifyName'] = fullName
        if(dob === "") {
            this.config['verifyDob'] = dob
        } else {
            let t = moment(dob, 'YYYY/MM/DD')
            if(t.isValid()) {
                this.config['verifyDob'] = dob
            } else {
                throw new InvalidArgumentException('Invalid birthday format (YYYY/MM/DD)')
            }
        }
        if(ageRange === "") {
            this.config['verifyAge'] = ageRange
        } else {
            let ageVerifyReg = /^\d+-\d$/
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
     * @param countryCodes ISO ALPHA-2 Country Code separated by comma
     */
    restrictCountry(countryCodes="US,CA,UK") {
        this.config['restrictCountry'] = countryCodes
    }

    /**
     * Check if the document was issued by specified state. Separate multiple values with comma. For example "CA,TX" would accept documents from California and Texas.
     *
     * @param states State full name or abbreviation separated by comma
     */
    restrictState(states = 'CA,TX') {
        this.config['restrictState'] = states
    }

    /**
     * Check if the document was one of the specified types. For example, "PD" would accept both passport and driver license.
     *
     * @param documentType P: Passport, D: Driver's License, I: Identity Card
     */
    restrictType(documentType = 'DIP') {
        this.config['restrictType'] = documentType
    }

    /**
     * Initiate a new identity document scan & ID face verification transaction by providing input images.
     *
     * @param documentFront Front of Document (file path, base64 content, url, or cache reference)
     * @param documentBack Back of Document (file path, base64 content or URL, or cache reference)
     * @param facePhoto Face Photo (file path, base64 content or URL, or cache reference)
     * @param faceVideo Face Video (file path, base64 content or URL)
     * @returns {Promise<*>}
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
     * @param documentFront Front of Document (file path, base64 content or URL)
     * @param documentBack Back of Document (file path, base64 content or URL)
     * @param cacheImage Cache uploaded image(s) for 24 hours and obtain a cache reference for each image, the reference hash can be used to start standard scan transaction without re-uploading the file.
     * @returns {Promise<*>}
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
}

class Transaction extends _ApiParent {
    /**
     *
     * @param apiKey You API key
     */
    constructor(apiKey=null) {
        super(apiKey);
    }

    /**
     * Retrieve a single transaction record
     *
     * @param transactionId Transaction ID
     * @returns {Promise<*>}
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
     * @param order Sort results by newest(-1) or oldest(1)
     * @param limit Number of items to be returned per call
     * @param offset Start the list from a particular entry index
     * @param createdAtMin List transactions that were created after this timestamp
     * @param createdAtMax List transactions that were created before this timestamp
     * @param filterCustomData Filter result by customData field
     * @param filterDecision Filter result by decision (accept, review, reject)
     * @param filterDocupass Filter result by Docupass reference
     * @param filterProfileId Filter result by KYC Profile ID
     * @returns {Promise<*>}
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

        let resp = await this.http.get(GetEndpoint('transaction'), payload, {
            timeout: 60000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     * Update transaction decision, updated decision will be relayed to webhook if set.
     *
     * @param transactionId Transaction ID
     * @param decision New decision (accept, review or reject)
     * @returns {Promise<*>}
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
     * @param transactionId Transaction ID
     * @returns {Promise<*>}
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
     * @param imageToken Image token from transaction API response
     * @param destination Full destination path including file name, file extension should be jpg, for example: '\home\idcard.jpg'
     * @returns {Promise<void>}
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
     * @param fileName Secured file name
     * @param destination Full destination path including file name, for example: '\home\auditreport.pdf'
     * @returns {Promise<void>}
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
     * @param destination Full destination path including file name, file extension should be zip, for example: '\home\archive.zip'
     * @param exportType 'csv' or 'json'
     * @param ignoreUnrecognized Ignore unrecognized documents
     * @param ignoreDuplicate Ignore duplicated entries
     * @param transactionId Export only the specified transaction IDs
     * @param createdAtMin Export only transactions that were created after this timestamp
     * @param createdAtMax Export only transactions that were created before this timestamp
     * @param filterCustomData Filter export by customData field
     * @param filterDecision Filter export by decision (accept, review, reject)
     * @param filterDocupass Filter export by Docupass reference
     * @param filterProfileId Filter export by KYC Profile ID
     * @returns {Promise<void>}
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

class Docupass extends _ApiParent {
    /**
     *
     * @param apiKey You API key
     */
    constructor(apiKey = null) {
        super(apiKey);
    }

    /**
     * @param order
     * @param limit
     * @param offset
     * @returns {Promise<*>}
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
        let resp = await this.http.get(GetEndpoint('docupass'), payload, {
            timeout: 30000,
        })
        return ApiExceptionHandle(resp.data, this.throwError)
    }

    /**
     *
     * @param mode
     * @param profile
     * @param contractFormat
     * @param contractGenerate
     * @param reusable
     * @param contractPrefill
     * @param contractSign
     * @param customData
     * @param language
     * @param referenceDocument
     * @param referenceDocumentBack
     * @param referenceFace
     * @param userPhone
     * @param verifyAddress
     * @param verifyAge
     * @param verifyDOB
     * @param verifyDocumentNumber
     * @param verifyName
     * @param verifyPostcode
     * @returns {Promise<*>}
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
     *
     * @param reference
     * @returns {Promise<*>}
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


export {Profile, Biometric, Contract, Scanner, Transaction, Docupass, SetEndpoint, APIError, InvalidArgumentException};
