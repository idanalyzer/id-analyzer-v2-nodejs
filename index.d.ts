// Type definitions for idanalyzer2 (ID Analyzer API v2 Node.js SDK)
// The package default-exports a namespace object containing every class.

/**
 * A decoded JSON object returned by the ID Analyzer API. The exact shape
 * depends on the endpoint; see https://developer.idanalyzer.com for per-endpoint
 * response schemas.
 */
export type ApiResponse = Record<string, any>;

/**
 * Error thrown when the ID Analyzer API returns an error payload and exception
 * throwing has been enabled via {@link Biometric.throwApiException} (or the same
 * method on any other client).
 */
export class APIError extends Error {
  /** Human-readable error message from the API. */
  msg: string;
  /** Machine-readable error code from the API. */
  code: number | string;
  /**
   * @param message Human-readable error message from the API.
   * @param code Machine-readable error code from the API.
   */
  constructor(message: string, code: number | string);
}

/** Error thrown when an argument passed to an SDK method is missing or invalid. */
export class InvalidArgumentException extends Error {}

/**
 * Internal base class shared by all API client classes. Handles API key
 * resolution, the shared request configuration object and exception behaviour.
 * Not intended to be instantiated directly.
 */
declare class _ApiParent {
  /**
   * @param apiKey Your API key. If omitted, the `IDANALYZER_KEY` environment
   *   variable is used.
   */
  constructor(apiKey?: string | null);
  /** The resolved API key. */
  apiKey: string;
  /** The shared request configuration object sent with each API call. */
  config: Record<string, any>;
  /** Whether an {@link APIError} is thrown when the API returns an error. */
  throwError: boolean;
  /**
   * Resolve the API key, preferring the provided value and falling back to the
   * `IDANALYZER_KEY` environment variable.
   * @param customKey Explicitly supplied API key.
   * @returns The resolved API key, or `null` if none is available.
   */
  getApiKey(customKey?: string | null): string | null;
  /**
   * Set an arbitrary API parameter without using the built-in helper methods.
   * @param key Parameter key.
   * @param value Parameter value.
   */
  setParam(key: string, value: any): void;
  /**
   * Control whether an {@link APIError} is thrown when the API response
   * contains an error message.
   * @param sw `true` to throw on API errors, `false` to return the raw error.
   */
  throwApiException(sw?: boolean): void;
}

/**
 * KYC Profile builder. A profile defines how documents are processed and
 * validated; reference a preset (`SECURITY_*`) or custom profile ID and layer
 * per-request overrides via the setter methods. Pass the result to
 * {@link Scanner.setProfile} or {@link Biometric.setProfile}.
 */
export class Profile {
  /** Preset profile applying no validation. */
  static SECURITY_NONE: string;
  /** Preset profile applying low-strictness validation. */
  static SECURITY_LOW: string;
  /** Preset profile applying medium-strictness validation. */
  static SECURITY_MEDIUM: string;
  /** Preset profile applying high-strictness validation. */
  static SECURITY_HIGH: string;
  /** The resolved profile ID (preset or custom). */
  profileId: string;
  /** Per-request profile overrides accumulated by the setter methods. */
  profileOverride: Record<string, any>;
  /**
   * @param profileId Custom profile ID or a preset profile (`security_none`,
   *   `security_low`, `security_medium`, `security_high`). `SECURITY_NONE` is
   *   used if left blank.
   */
  constructor(profileId: string);
  /**
   * Replace the profile overrides with the contents of a JSON string.
   * @param jsonStr JSON string containing profile information.
   */
  loadFromJson(jsonStr?: string): void;
  /**
   * Maximum canvas dimension in pixels; larger inputs are scaled down before
   * processing. Set 0 to disable resizing.
   * @param pixels Maximum canvas dimension in pixels.
   */
  canvasSize(pixels: number): void;
  /**
   * Correct image orientation for rotated images.
   * @param enabled Whether to enable automatic orientation correction.
   */
  orientationCorrection(enabled: boolean): void;
  /**
   * Automatically detect and return the locations of signature, document and face.
   * @param enabled Whether to enable object detection.
   */
  objectDetection(enabled: boolean): void;
  /**
   * Parse AAMVA barcodes for US/CA ID/DL.
   * @param enabled Whether to enable AAMVA barcode parsing.
   */
  AAMVABarcodeParsing(enabled: boolean): void;
  /**
   * Control whether scan results and output images are saved on the cloud.
   * @param enableSaveTransaction Whether the scan transaction result is saved.
   * @param enableSaveTransactionImages Whether output images are also saved.
   */
  saveResult(enableSaveTransaction: boolean, enableSaveTransactionImages: boolean): void;
  /**
   * Control whether the output image is returned in the API response.
   * @param enableOutputImage Whether to return the output image.
   * @param outputFormat Output image format, "url" or "base64".
   */
  outputImage(enableOutputImage: boolean, outputFormat?: string): void;
  /**
   * Crop the image before saving and returning output.
   * @param enableAutoCrop Whether to auto-crop the document from the image.
   * @param enableAdvancedAutoCrop Whether to enable advanced (perspective-corrected) cropping.
   */
  autoCrop(enableAutoCrop: boolean, enableAdvancedAutoCrop: boolean): void;
  /**
   * Maximum width/height in pixels for output and saved image.
   * @param pixels Maximum width/height in pixels.
   */
  outputSize(pixels: number): void;
  /**
   * Generate a full name field from parsed first/middle/last name.
   * @param enabled Whether to infer the full name field.
   */
  inferFullName(enabled: boolean): void;
  /**
   * If the first name has more than one word, move the rest into middle name.
   * @param enabled Whether to split a multi-word first name.
   */
  splitFirstName(enabled: boolean): void;
  /**
   * Generate a detailed PDF audit report for every transaction.
   * @param enabled Whether to generate an audit report per transaction.
   */
  transactionAuditReport(enabled: boolean): void;
  /**
   * Set the timezone used in audit reports.
   * @param timezone TZ database name (e.g. "America/New_York"); UTC if blank.
   */
  setTimezone(timezone: string): void;
  /**
   * Redact and blur the given data fields before transaction storage.
   * @param fieldKeys Array of data field keys to redact.
   */
  obscure(fieldKeys: string[]): void;
  /**
   * Set a remote URL to receive Docupass verification and scan results.
   * @param url Remote webhook URL (http/https, non-localhost host).
   */
  webhook(url?: string): void;
  /**
   * Set the validation threshold of a specified component.
   * @param thresholdKey Threshold component key.
   * @param thresholdValue Threshold value.
   */
  threshold(thresholdKey: string, thresholdValue: number): void;
  /**
   * Set the review/reject decision trigger scores.
   * @param reviewTrigger Score at/above which the decision becomes "review".
   * @param rejectTrigger Score at/above which the decision becomes "reject".
   */
  decisionTrigger(reviewTrigger?: number, rejectTrigger?: number): void;
  /**
   * Enable/disable and fine-tune how a validation component affects the decision.
   * @param code Document Validation Component Code / Warning Code.
   * @param enabled Whether the component is enabled.
   * @param reviewThreshold Confidence threshold contributing to the review score.
   * @param rejectThreshold Confidence threshold contributing to the reject score.
   * @param weight Weight added to review/reject scores when validation fails.
   */
  setWarning(code?: string, enabled?: boolean, reviewThreshold?: number, rejectThreshold?: number, weight?: number): void;
  /**
   * Restrict accepted documents by issuing country.
   * @param countryCodes ISO ALPHA-2 country codes separated by comma.
   */
  restrictDocumentCountry(countryCodes?: string): void;
  /**
   * Restrict accepted documents by issuing state.
   * @param states State full names or abbreviations separated by comma.
   */
  restrictDocumentState(states?: string): void;
  /**
   * Restrict accepted documents by type.
   * @param documentType P: Passport, D: Driver's License, I: Identity Card.
   */
  restrictDocumentType(documentType?: string): void;
}

/**
 * Biometric API client. Performs 1:1 face verification and standalone liveness
 * checks.
 */
export class Biometric extends _ApiParent {
  /**
   * Set an arbitrary string to save with the transaction (e.g. a reference number).
   * @param customData Arbitrary string to store alongside the transaction.
   */
  setCustomData(customData: string): void;
  /**
   * Set the KYC profile to use.
   * @param profile A {@link Profile} object.
   */
  setProfile(profile: Profile): void;
  /**
   * Perform 1:1 face verification against a reference face image.
   * @param referenceFaceImage Reference face image (file path, base64, URL or cache reference).
   * @param facePhoto Face photo (file path, base64, URL or cache reference).
   * @param faceVideo Face video (file path, base64 or URL), used if `facePhoto` is empty.
   * @returns The parsed API response.
   */
  verifyFace(referenceFaceImage?: string, facePhoto?: string, faceVideo?: string): Promise<ApiResponse>;
  /**
   * Perform a standalone liveness check on a selfie photo or video.
   * @param facePhoto Face photo (file path, base64, URL or cache reference).
   * @param faceVideo Face video (file path, base64 or URL), used if `facePhoto` is empty.
   * @returns The parsed API response.
   */
  verifyLiveness(facePhoto?: string, faceVideo?: string): Promise<ApiResponse>;
}

/**
 * Contract API client. Manages contract templates and generates filled
 * documents (PDF/DOCX/HTML) from templates and transaction data.
 */
export class Contract extends _ApiParent {
  /**
   * Generate a document using a template and transaction data.
   * @param templateId Template ID.
   * @param _format Output format: PDF, DOCX or HTML.
   * @param transactionId Fill the template with data from this transaction.
   * @param fillData Key-value pairs to autofill dynamic fields.
   * @returns The parsed API response.
   */
  generate(templateId?: string, _format?: string, transactionId?: string, fillData?: Record<string, any> | null): Promise<ApiResponse>;
  /**
   * Retrieve a list of contract templates.
   * @param order Sort by newest(-1) or oldest(1).
   * @param limit Number of items per call.
   * @param offset Start index.
   * @param filterTemplateId Filter by template ID.
   * @returns The parsed API response.
   */
  listTemplate(order?: number, limit?: number, offset?: number, filterTemplateId?: string): Promise<ApiResponse>;
  /**
   * Get a single contract template.
   * @param templateId Template ID.
   * @returns The parsed API response.
   */
  getTemplate(templateId?: string): Promise<ApiResponse>;
  /**
   * Delete a contract template.
   * @param templateId Template ID.
   * @returns The parsed API response.
   */
  deleteTemplate(templateId?: string): Promise<ApiResponse>;
  /**
   * Create a new contract template.
   * @param name Template name.
   * @param content Template HTML content.
   * @param orientation 0=Portrait(Default), 1=Landscape.
   * @param timezone Template timezone.
   * @param font Template font.
   * @returns The parsed API response.
   */
  createTemplate(name?: string, content?: string, orientation?: string, timezone?: string, font?: string): Promise<ApiResponse>;
  /**
   * Update an existing contract template.
   * @param templateId Template ID.
   * @param name Template name.
   * @param content Template HTML content.
   * @param orientation 0=Portrait(Default), 1=Landscape.
   * @param timezone Template timezone.
   * @param font Template font.
   * @returns The parsed API response.
   */
  updateTemplate(templateId?: string, name?: string, content?: string, orientation?: string, timezone?: string, font?: string): Promise<ApiResponse>;
}

/**
 * Scanner API client. Initiates identity document scans (full KYC, plus
 * quick/very-quick OCR-only variants) and configures verification, document
 * restrictions and contract generation.
 */
export class Scanner extends _ApiParent {
  /**
   * Pass the user IP to check the ID issuing country against it.
   * @param ip User IP address; the HTTP connection IP is used if empty.
   */
  setUserIp(ip: string): void;
  /**
   * Set an arbitrary string to save with the transaction.
   * @param customData Arbitrary string to store alongside the transaction.
   */
  setCustomData(customData: string): void;
  /**
   * Automatically generate a contract document using values parsed from the ID.
   * @param templateId Up to 5 contract template IDs (comma-separated); empty disables generation.
   * @param _format Output format: PDF, DOCX or HTML.
   * @param extraFillData Key-value pairs to autofill dynamic fields.
   */
  setContractOptions(templateId?: string, _format?: string, extraFillData?: Record<string, any> | null): void;
  /**
   * Set the KYC profile to use.
   * @param profile A {@link Profile} object.
   */
  setProfile(profile: Profile): void;
  /**
   * Check that customer information matches the uploaded document.
   * @param documentNumber Document or ID number.
   * @param fullName Full name.
   * @param dob Date of birth in YYYY/MM/DD.
   * @param ageRange Age range, e.g. "18-40".
   * @param address Address.
   * @param postcode Postcode.
   */
  verifyUserInformation(documentNumber?: string, fullName?: string, dob?: string, ageRange?: string, address?: string, postcode?: string): void;
  /**
   * Restrict accepted documents by issuing country.
   * @param countryCodes ISO ALPHA-2 country codes separated by comma.
   */
  restrictCountry(countryCodes?: string): void;
  /**
   * Restrict accepted documents by issuing state.
   * @param states State full names or abbreviations separated by comma.
   */
  restrictState(states?: string): void;
  /**
   * Restrict accepted documents by type.
   * @param documentType P: Passport, D: Driver's License, I: Identity Card.
   */
  restrictType(documentType?: string): void;
  /**
   * Initiate a new identity document scan & ID face verification transaction.
   * @param documentFront Front of document (file path, base64, URL or cache reference).
   * @param documentBack Back of document (file path, base64, URL or cache reference).
   * @param facePhoto Face photo (file path, base64, URL or cache reference).
   * @param faceVideo Face video (file path, base64 or URL), used if `facePhoto` is empty.
   * @returns The parsed API response.
   */
  scan(documentFront?: string, documentBack?: string, facePhoto?: string, faceVideo?: string): Promise<ApiResponse>;
  /**
   * Initiate a quick OCR-only document scan.
   * @param documentFront Front of document (file path, base64 or URL).
   * @param documentBack Back of document (file path, base64 or URL).
   * @param cacheImage Cache uploaded image(s) for 24 hours and return a cache reference.
   * @returns The parsed API response.
   */
  quickScan(documentFront?: string, documentBack?: string, cacheImage?: boolean): Promise<ApiResponse>;
  /**
   * Initiate a very quick (fast, less thorough) OCR-only document scan.
   * @param documentFront Front of document (file path, base64 or URL).
   * @param documentBack Back of document (file path, base64 or URL).
   * @param cacheImage Cache uploaded image(s) for 24 hours and return a cache reference.
   * @returns The parsed API response.
   */
  veryQuickScan(documentFront?: string, documentBack?: string, cacheImage?: boolean): Promise<ApiResponse>;
}

/**
 * Transaction API client. Retrieves, lists, updates and deletes transactions,
 * and downloads transaction images, files and archive exports.
 */
export class Transaction extends _ApiParent {
  /**
   * Retrieve a single transaction record.
   * @param transactionId Transaction ID.
   * @returns The parsed API response.
   */
  getTransaction(transactionId?: string): Promise<ApiResponse>;
  /**
   * Retrieve a list of transaction history.
   * @param order Sort by newest(-1) or oldest(1).
   * @param limit Number of items per call.
   * @param offset Start index.
   * @param createdAtMin Created-after UNIX timestamp.
   * @param createdAtMax Created-before UNIX timestamp.
   * @param filterCustomData Filter by customData field.
   * @param filterDecision Filter by decision (accept, review, reject).
   * @param filterDocupass Filter by Docupass reference.
   * @param filterProfileId Filter by KYC Profile ID.
   * @returns The parsed API response.
   */
  listTransaction(order?: number, limit?: number, offset?: number, createdAtMin?: number, createdAtMax?: number, filterCustomData?: string, filterDecision?: string, filterDocupass?: string, filterProfileId?: string): Promise<ApiResponse>;
  /**
   * Update a transaction's decision (relayed to the webhook if set).
   * @param transactionId Transaction ID.
   * @param decision New decision (accept, review or reject).
   * @returns The parsed API response.
   */
  updateTransaction(transactionId?: string, decision?: string): Promise<ApiResponse>;
  /**
   * Delete a transaction.
   * @param transactionId Transaction ID.
   * @returns The parsed API response.
   */
  deleteTransaction(transactionId?: string): Promise<ApiResponse>;
  /**
   * Download a transaction image to the local filesystem.
   * @param imageToken Image token from the transaction API response.
   * @param destination Full destination path including file name (e.g. a .jpg file).
   * @returns Resolves once the image has been written to disk.
   */
  saveImage(imageToken?: string, destination?: string): Promise<void>;
  /**
   * Download a transaction file to the local filesystem.
   * @param fileName Secured file name obtained from the transaction.
   * @param destination Full destination path including file name.
   * @returns Resolves once the file has been written to disk.
   */
  saveFile(fileName?: string, destination?: string): Promise<void>;
  /**
   * Download a transaction archive export to the local filesystem.
   * @param destination Full destination path including file name (e.g. a .zip file).
   * @param transactionId Export only the specified transaction IDs; `null` exports all matching.
   * @param exportType Export format, 'csv' or 'json'.
   * @param ignoreUnrecognized Ignore unrecognized documents.
   * @param ignoreDuplicate Ignore duplicated entries.
   * @param createdAtMin Created-after UNIX timestamp.
   * @param createdAtMax Created-before UNIX timestamp.
   * @param filterCustomData Filter by customData field.
   * @param filterDecision Filter by decision (accept, review, reject).
   * @param filterDocupass Filter by Docupass reference.
   * @param filterProfileId Filter by KYC Profile ID.
   * @returns Resolves once the archive has been downloaded to disk (if available).
   */
  exportTransaction(destination?: string, transactionId?: string[] | null, exportType?: string, ignoreUnrecognized?: boolean, ignoreDuplicate?: boolean, createdAtMin?: number, createdAtMax?: number, filterCustomData?: string, filterDecision?: string, filterDocupass?: string, filterProfileId?: string): Promise<void>;
}

/**
 * Docupass API client. Creates, lists, retrieves and deletes Docupass
 * verification sessions (hosted ID verification links/forms).
 */
export class Docupass extends _ApiParent {
  /**
   * Retrieve a list of Docupass sessions.
   * @param order Sort by newest(-1) or oldest(1).
   * @param limit Number of items per call.
   * @param offset Start index.
   * @returns The parsed API response.
   */
  listDocupass(order?: number, limit?: number, offset?: number): Promise<ApiResponse>;
  /**
   * Create a new Docupass verification session.
   * @param profile KYC Profile ID to apply (required).
   * @param mode Docupass verification mode.
   * @param contractFormat Generated contract format ('pdf', 'docx' or 'html').
   * @param contractGenerate Contract template ID(s) to auto-generate on completion.
   * @param reusable Whether the Docupass link can be reused by multiple users.
   * @param contractPrefill Data used to prefill the generated contract.
   * @param contractSign Contract signing configuration.
   * @param customData Arbitrary string to store alongside the transaction.
   * @param language Display language for the Docupass page.
   * @param referenceDocument Reference document front image to verify against.
   * @param referenceDocumentBack Reference document back image to verify against.
   * @param referenceFace Reference face image to verify against.
   * @param userPhone User phone number.
   * @param verifyAddress Address to verify against the submitted document.
   * @param verifyAge Age range to verify against the submitted document.
   * @param verifyDOB Date of birth (YYYY/MM/DD) to verify.
   * @param verifyDocumentNumber Document/ID number to verify.
   * @param verifyName Full name to verify.
   * @param verifyPostcode Postcode to verify.
   * @returns The parsed API response.
   */
  createDocupass(profile?: string | null, mode?: number, contractFormat?: string, contractGenerate?: string, reusable?: boolean, contractPrefill?: string, contractSign?: string, customData?: string, language?: string, referenceDocument?: string | null, referenceDocumentBack?: string | null, referenceFace?: string | null, userPhone?: string, verifyAddress?: string, verifyAge?: string, verifyDOB?: string, verifyDocumentNumber?: string, verifyName?: string, verifyPostcode?: string): Promise<ApiResponse>;
  /**
   * Retrieve a single Docupass record by reference.
   * @param reference Docupass reference ID.
   * @returns The parsed API response.
   */
  getDocupass(reference?: string): Promise<ApiResponse>;
  /**
   * Delete a Docupass session by reference.
   * @param reference Docupass reference ID.
   * @returns The parsed API response.
   */
  deleteDocupass(reference?: string): Promise<ApiResponse>;
}

/**
 * AML (Anti-Money-Laundering) API client. Searches sanction, PEP and watchlist
 * databases via the v1 and v3 search endpoints.
 */
export class AML extends _ApiParent {
  /**
   * Search the AML database (v1 endpoint).
   * @param name Person or business name.
   * @param idNumber Document number.
   * @param entity 0=Person, 1=Corporation/Legal Entity.
   * @param country Two-digit ISO country code to filter by.
   * @param database Optional array of databases to search; all if omitted.
   * @param birthYear Filter by year of birth.
   * @returns The parsed API response.
   */
  search(name?: string, idNumber?: string, entity?: number, country?: string, database?: string[] | null, birthYear?: string): Promise<ApiResponse>;
  /**
   * Search the AML database (v3 endpoint). Provide a free-text query or entity IDs.
   * @param text Full-text query (name, alias, document/tax/registration number, etc.).
   * @param id One or more AML entity IDs separated by comma or newline (max 50).
   * @param limit Number of results per page (0 uses the API default).
   * @param page Result page number (0 uses the API default).
   * @returns The parsed API response.
   */
  searchV3(text?: string, id?: string, limit?: number, page?: number): Promise<ApiResponse>;
}

/**
 * Profile API client. Manages stored KYC profiles on your account
 * (list, retrieve, create, update, delete and export).
 */
export class ProfileAPI extends _ApiParent {
  /**
   * List KYC profiles.
   * @param order Sort by newest(-1) or oldest(1).
   * @param limit Number of items per call.
   * @param offset Start index.
   * @returns The parsed API response.
   */
  listProfile(order?: number, limit?: number, offset?: number): Promise<ApiResponse>;
  /**
   * Retrieve a single KYC profile.
   * @param profileId KYC profile ID.
   * @returns The parsed API response.
   */
  getProfile(profileId?: string): Promise<ApiResponse>;
  /**
   * Create a new KYC profile.
   * @param name Profile name.
   * @param profile A {@link Profile} object (its overrides become the config) or a plain object.
   * @returns The parsed API response.
   */
  createProfile(name?: string, profile?: Profile | Record<string, any> | null): Promise<ApiResponse>;
  /**
   * Update an existing KYC profile.
   * @param profileId KYC profile ID.
   * @param name New profile name.
   * @param profile A {@link Profile} object (its overrides become the config) or a plain object.
   * @returns The parsed API response.
   */
  updateProfile(profileId?: string, name?: string, profile?: Profile | Record<string, any> | null): Promise<ApiResponse>;
  /**
   * Delete a KYC profile.
   * @param profileId KYC profile ID.
   * @returns The parsed API response.
   */
  deleteProfile(profileId?: string): Promise<ApiResponse>;
  /**
   * Export a KYC profile.
   * @param profileId KYC profile ID.
   * @returns The parsed API response.
   */
  exportProfile(profileId?: string): Promise<ApiResponse>;
}

/**
 * Webhook API client. Lists webhook delivery logs and allows resending or
 * deleting individual delivery records.
 */
export class Webhook extends _ApiParent {
  /**
   * List webhook delivery logs.
   * @param order Sort by newest(-1) or oldest(1).
   * @param limit Number of items per call.
   * @param offset Start index.
   * @param event Filter by event type.
   * @param success Filter by delivery success: 1=success, 0=failure, -1=no filter.
   * @param createdAtMin List deliveries created after this timestamp.
   * @param createdAtMax List deliveries created before this timestamp.
   * @returns The parsed API response.
   */
  listWebhook(order?: number, limit?: number, offset?: number, event?: string, success?: number, createdAtMin?: string, createdAtMax?: string): Promise<ApiResponse>;
  /**
   * Resend a webhook delivery.
   * @param webhookId Webhook delivery ID.
   * @returns The parsed API response.
   */
  resendWebhook(webhookId?: string): Promise<ApiResponse>;
  /**
   * Delete a webhook delivery log.
   * @param webhookId Webhook delivery ID.
   * @returns The parsed API response.
   */
  deleteWebhook(webhookId?: string): Promise<ApiResponse>;
}

/** Account API client. Retrieves the current account profile, quota and usage. */
export class Account extends _ApiParent {
  /**
   * Retrieve the current account profile, quota and usage.
   * @returns The parsed API response.
   */
  getAccount(): Promise<ApiResponse>;
}

/**
 * Override the API base endpoint for all subsequent requests, bypassing the
 * region-based default. Pass an empty string to clear the override.
 * @param endpoint Fully-qualified base URL to use as the API endpoint.
 */
export function SetEndpoint(endpoint?: string): void;

/**
 * The default-exported namespace object containing every public SDK class and
 * helper.
 */
declare const IdAnalyzer: {
  Profile: typeof Profile;
  Biometric: typeof Biometric;
  Contract: typeof Contract;
  Scanner: typeof Scanner;
  Transaction: typeof Transaction;
  Docupass: typeof Docupass;
  AML: typeof AML;
  ProfileAPI: typeof ProfileAPI;
  Webhook: typeof Webhook;
  Account: typeof Account;
  SetEndpoint: typeof SetEndpoint;
  APIError: typeof APIError;
  InvalidArgumentException: typeof InvalidArgumentException;
};

export default IdAnalyzer;
