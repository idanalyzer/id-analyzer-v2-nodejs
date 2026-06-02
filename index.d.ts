// Type definitions for idanalyzer2 (ID Analyzer API v2 Node.js SDK)
// The package default-exports a namespace object containing every class.

export type ApiResponse = Record<string, any>;

export class APIError extends Error {
  msg: string;
  code: number | string;
  constructor(message: string, code: number | string);
}

export class InvalidArgumentException extends Error {}

declare class _ApiParent {
  constructor(apiKey?: string | null);
  apiKey: string;
  config: Record<string, any>;
  throwError: boolean;
  getApiKey(customKey?: string | null): string | null;
  setParam(key: string, value: any): void;
  throwApiException(sw?: boolean): void;
}

export class Profile {
  static SECURITY_NONE: string;
  static SECURITY_LOW: string;
  static SECURITY_MEDIUM: string;
  static SECURITY_HIGH: string;
  profileId: string;
  profileOverride: Record<string, any>;
  constructor(profileId: string);
  loadFromJson(jsonStr?: string): void;
  canvasSize(pixels: number): void;
  orientationCorrection(enabled: boolean): void;
  objectDetection(enabled: boolean): void;
  AAMVABarcodeParsing(enabled: boolean): void;
  saveResult(enableSaveTransaction: boolean, enableSaveTransactionImages: boolean): void;
  outputImage(enableOutputImage: boolean, outputFormat?: string): void;
  autoCrop(enableAutoCrop: boolean, enableAdvancedAutoCrop: boolean): void;
  outputSize(pixels: number): void;
  inferFullName(enabled: boolean): void;
  splitFirstName(enabled: boolean): void;
  transactionAuditReport(enabled: boolean): void;
  setTimezone(timezone: string): void;
  obscure(fieldKeys: string[]): void;
  webhook(url?: string): void;
  threshold(thresholdKey: string, thresholdValue: number): void;
  decisionTrigger(reviewTrigger?: number, rejectTrigger?: number): void;
  setWarning(code?: string, enabled?: boolean, reviewThreshold?: number, rejectThreshold?: number, weight?: number): void;
  restrictDocumentCountry(countryCodes?: string): void;
  restrictDocumentState(states?: string): void;
  restrictDocumentType(documentType?: string): void;
}

export class Biometric extends _ApiParent {
  setCustomData(customData: string): void;
  setProfile(profile: Profile): void;
  verifyFace(referenceFaceImage?: string, facePhoto?: string, faceVideo?: string): Promise<ApiResponse>;
  verifyLiveness(facePhoto?: string, faceVideo?: string): Promise<ApiResponse>;
}

export class Contract extends _ApiParent {
  generate(templateId?: string, _format?: string, transactionId?: string, fillData?: Record<string, any> | null): Promise<ApiResponse>;
  listTemplate(order?: number, limit?: number, offset?: number, filterTemplateId?: string): Promise<ApiResponse>;
  getTemplate(templateId?: string): Promise<ApiResponse>;
  deleteTemplate(templateId?: string): Promise<ApiResponse>;
  createTemplate(name?: string, content?: string, orientation?: string, timezone?: string, font?: string): Promise<ApiResponse>;
  updateTemplate(templateId?: string, name?: string, content?: string, orientation?: string, timezone?: string, font?: string): Promise<ApiResponse>;
}

export class Scanner extends _ApiParent {
  setUserIp(ip: string): void;
  setCustomData(customData: string): void;
  setContractOptions(templateId?: string, _format?: string, extraFillData?: Record<string, any> | null): void;
  setProfile(profile: Profile): void;
  verifyUserInformation(documentNumber?: string, fullName?: string, dob?: string, ageRange?: string, address?: string, postcode?: string): void;
  restrictCountry(countryCodes?: string): void;
  restrictState(states?: string): void;
  restrictType(documentType?: string): void;
  scan(documentFront?: string, documentBack?: string, facePhoto?: string, faceVideo?: string): Promise<ApiResponse>;
  quickScan(documentFront?: string, documentBack?: string, cacheImage?: boolean): Promise<ApiResponse>;
  veryQuickScan(documentFront?: string, documentBack?: string, cacheImage?: boolean): Promise<ApiResponse>;
}

export class Transaction extends _ApiParent {
  getTransaction(transactionId?: string): Promise<ApiResponse>;
  listTransaction(order?: number, limit?: number, offset?: number, createdAtMin?: number, createdAtMax?: number, filterCustomData?: string, filterDecision?: string, filterDocupass?: string, filterProfileId?: string): Promise<ApiResponse>;
  updateTransaction(transactionId?: string, decision?: string): Promise<ApiResponse>;
  deleteTransaction(transactionId?: string): Promise<ApiResponse>;
  saveImage(imageToken?: string, destination?: string): Promise<void>;
  saveFile(fileName?: string, destination?: string): Promise<void>;
  exportTransaction(destination?: string, transactionId?: string[] | null, exportType?: string, ignoreUnrecognized?: boolean, ignoreDuplicate?: boolean, createdAtMin?: number, createdAtMax?: number, filterCustomData?: string, filterDecision?: string, filterDocupass?: string, filterProfileId?: string): Promise<void>;
}

export class Docupass extends _ApiParent {
  listDocupass(order?: number, limit?: number, offset?: number): Promise<ApiResponse>;
  createDocupass(profile?: string | null, mode?: number, contractFormat?: string, contractGenerate?: string, reusable?: boolean, contractPrefill?: string, contractSign?: string, customData?: string, language?: string, referenceDocument?: string | null, referenceDocumentBack?: string | null, referenceFace?: string | null, userPhone?: string, verifyAddress?: string, verifyAge?: string, verifyDOB?: string, verifyDocumentNumber?: string, verifyName?: string, verifyPostcode?: string): Promise<ApiResponse>;
  getDocupass(reference?: string): Promise<ApiResponse>;
  deleteDocupass(reference?: string): Promise<ApiResponse>;
}

export class AML extends _ApiParent {
  search(name?: string, idNumber?: string, entity?: number, country?: string, database?: string[] | null, birthYear?: string): Promise<ApiResponse>;
  searchV3(text?: string, id?: string, limit?: number, page?: number): Promise<ApiResponse>;
}

export class ProfileAPI extends _ApiParent {
  listProfile(order?: number, limit?: number, offset?: number): Promise<ApiResponse>;
  getProfile(profileId?: string): Promise<ApiResponse>;
  createProfile(name?: string, profile?: Profile | Record<string, any> | null): Promise<ApiResponse>;
  updateProfile(profileId?: string, name?: string, profile?: Profile | Record<string, any> | null): Promise<ApiResponse>;
  deleteProfile(profileId?: string): Promise<ApiResponse>;
  exportProfile(profileId?: string): Promise<ApiResponse>;
}

export class Webhook extends _ApiParent {
  listWebhook(order?: number, limit?: number, offset?: number, event?: string, success?: number, createdAtMin?: string, createdAtMax?: string): Promise<ApiResponse>;
  resendWebhook(webhookId?: string): Promise<ApiResponse>;
  deleteWebhook(webhookId?: string): Promise<ApiResponse>;
}

export class Account extends _ApiParent {
  getAccount(): Promise<ApiResponse>;
}

export function SetEndpoint(endpoint?: string): void;

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
