// import { IMpartyLimits, IMpartyValidatorError } from '../interfaces';

// : Partial<Record<keyof IMpartyLimits, IMpartyValidatorError>>
export const VALIDATION_ERRORS = {
  extensions: (extensions: string[]): string => `File extension is not allowed. Allowed extensions are: ${extensions}`,
  fileSize: (size: number): string => `File size exceeded. Max size is: ${size / 1000}kb`,
  fields: (amount: number): string => `Fields limit exceeded. Max fields amount is: ${amount}`,
  files: (amount: number): string => `Files limit exceeded. Max files amount is: ${amount}`,
  parts: (amount: number): string => `Parts limit exceeded. Max parts amount is: ${amount}`,
  allowedFilesFields: (filesFields: string[]): string => `Only files with next fieldNames are allowed: ${filesFields}`,
  requiredFilesFields: (filesFields: string[]): string => `Files with next fieldNames are required: ${filesFields}`,
};

export enum ERROR_CODES {
  BUSBOY_ERROR = 'BUSBOY_ERROR',
  REQUEST_ERROR = 'REQUEST_ERROR',
  REQUEST_ABORTED = 'REQUEST_ABORTED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONTENT_TYPE = 'UNSUPPORTED_CONTENT_TYPE',
  INVALID_OPTIONS = 'INVALID_OPTIONS',
}
