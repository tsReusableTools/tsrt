/* eslint-disable @typescript-eslint/no-explicit-any */
export type BusboyOnFieldArgs = [
  fieldName: string,
  value: any,
  fieldNameTruncated: string,
  valueTruncated: any,
  encoding: string,
  mimetype: string
];

export type BusboyOnFileArgs = [
  fieldName: string,
  file: NodeJS.ReadableStream,
  originalFileName: string,
  encoding: string,
  mimetype: string
];
