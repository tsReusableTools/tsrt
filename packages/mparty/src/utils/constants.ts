import { IMpartyOptions, IFileMetadata } from '../interfaces';

// : Partial<Record<keyof IMpartyLimits, IMpartyValidatorError>>
export const VALIDATION_ERRORS = {
  extensions: (extensions: string[]): string => `File extension is not allowed. Allowed extensions are: ${extensions}`,
  allowedFiles: (filesFields: string[]): string => `Only files with next fieldNames are allowed: ${filesFields}`,
  requiredFiles: (filesFields: string[]): string => `Files with next fieldNames are required: ${filesFields}`,

  // Busboy
  fileSize: (size: number): string => `File size exceeded. Max size is: ${size / 1000}kb`,
  files: (amount: number): string => `Files limit exceeded. Max files amount is: ${amount}`,
  parts: (amount: number): string => `Parts limit exceeded. Max parts amount is: ${amount}`,

  fields: (amount: number): string => `Fields limit exceeded. Max fields amount is: ${amount}`,
  fieldNameSize: (amount: number): string => `Field name size limit exceeded. Max size is: ${amount}b`,
  fieldSize: (amount: number): string => `Field value size limit exceeded. Max size is: ${amount}b`,
};

export enum ERRORS {
  BUSBOY_ERROR = 'BUSBOY_ERROR',
  BUSBOY_VALIDATION_ERROR = 'BUSBOY_VALIDATION_ERROR',
  REQUEST_ERROR = 'REQUEST_ERROR',
  REQUEST_ABORTED = 'REQUEST_ABORTED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_OPTIONS = 'INVALID_OPTIONS',
}

export const DEFAULT_OPTIONS: IMpartyOptions<IFileMetadata> = {
  failOnJson: false,
  removeUploadedFilesOnError: true,
};
