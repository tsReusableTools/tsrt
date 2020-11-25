/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IMartyFieldForValidation {
  fieldName: string,
  value: any,
  fieldNameTruncated: string,
  valueTruncated: any,
}

export interface IMartyFileForValidation {
  fieldName: string,
  originalFileName: string,
}
