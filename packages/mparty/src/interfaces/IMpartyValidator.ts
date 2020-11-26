/* eslint-disable @typescript-eslint/no-explicit-any */
import { IMpartyLimits } from './IMpartyLimits';

export interface IMartyFieldForValidation {
  fieldName: string;
  value: any;
  fieldNameTruncated: string;
  valueTruncated: any;
}

export interface IMartyFileForValidation {
  fieldName: string;
  originalFileName: string;
  extension: string;
}

export type ValidatationError = ((limits?: IMpartyLimits) => string) | string;
