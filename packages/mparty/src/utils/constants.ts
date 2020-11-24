// import { IMpartyLimits, IMpartyValidatorError } from '../interfaces';

// : Partial<Record<keyof IMpartyLimits, IMpartyValidatorError>>
export const ERRORS = {
  extensions: (extensions: string[]): string => `File extension is not allowed. Allowed extensions are: ${extensions}`,
  fileSize: (size: number): string => `File size exceeded. Max size is: ${size / 1000}kb`,
  fields: (amount: number): string => `Fields limit exceeded. Max fields amount is: ${amount}`,
  files: (amount: number): string => `Files limit exceeded. Max files amount is: ${amount}`,
  parts: (amount: number): string => `Parts limit exceeded. Max parts amount is: ${amount}`,
  allowedFilesFields: (filesFields?: string[]): string => `Only files with next fieldNames are allowed: ${filesFields}`,
  requiredFilesFields: (filesFields?: string[]): string => `Files with next fieldNames are required: ${filesFields}`,
};
