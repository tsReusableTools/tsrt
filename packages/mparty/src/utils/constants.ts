import { IMpartyOptions, IMpartyLimits } from '../interfaces';

/* eslint-disable-next-line */
export const DEFAULT_OPTIONS: IMpartyOptions<any> = {
  failOnJson: false,
  removeOnError: true,
};

export const ERRORS = {
  EXTENSIONS_ERROR: (limits?: IMpartyLimits): string => `File extension is not allowed. Allowed extensions are: ${limits?.extensions}`,
  ALLOWED_FIELDS_ERROR: (limits?: IMpartyLimits): string => `Only files with next fieldNames are allowed: ${limits?.allowedFiles}`,
  REQUIRED_FIELDS_ERROR: (limits?: IMpartyLimits): string => `Files with next fieldNames are required: ${limits?.requiredFiles}`,

  // Busboy
  FILE_SIZE_ERROR: (limits?: IMpartyLimits): string => `File size exceeded. Max size is: ${limits?.fileSize / 1000}kb`,
  FILES_LIMIT_ERROR: (limits?: IMpartyLimits): string => `Files limits exceeded. Max files amount is: ${limits?.files}`,
  PARTS_LIMIT_ERROR: (limits?: IMpartyLimits): string => `Parts limits exceeded. Max parts amount is: ${limits?.parts}`,

  FIELDS_LIMIT_ERROR: (limits?: IMpartyLimits): string => `Fields limits exceeded. Max fields amount is: ${limits?.fields}`,
  FIELD_NAME_SIZE_ERROR: (limits?: IMpartyLimits): string => `Field name size limits exceeded. Max size is: ${limits?.fieldNameSize}b`,
  FIELD_SIZE_ERROR: (limits?: IMpartyLimits): string => `Field value size limits exceeded. Max size is: ${limits?.fieldSize}b`,

  JSON_SCHEMA_ERROR_VALIDATION: 'JSON_SCHEMA_ERROR_VALIDATION',
  INVALID_OPTIONS: 'INVALID_OPTIONS',
  REQUEST_ERROR: 'REQUEST_ERROR',
  REQUEST_ABORTED: 'REQUEST_ABORTED',
};

export type ErrorCodes = keyof typeof ERRORS;
