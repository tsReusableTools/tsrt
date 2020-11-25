/**
 *  Busboy limits + some additional Mparty validation options
 *
 *  @see https://www.npmjs.com/package/busboy#busboy-methods
 */
export interface IMpartyLimits {
  // ===> Busboy validations:
  /** Max field name size (in bytes) (Default: 100 bytes). */
  fieldNameSize?: number;

  /** Max field value size (in bytes) (Default: 1MB). */
  fieldSize?: number;

  /** Max number of non-file fields (Default: Infinity). */
  fields?: number;

  /** For multipart forms, the max file size (in bytes) (Default: Infinity). */
  fileSize?: number;

  /** For multipart forms, the max number of file fields (Default: Infinity). */
  files?: number;

  /** For multipart forms, the max number of parts (fields + files) (Default: Infinity). */
  parts?: number;

  /** For multipart forms, the max number of header key=>value pairs to parse Default: 2000 (same as node's http). */
  headerPairs?: number;

  // ===> Additional multipart validations:
  /** Allowed files' extensions */
  extensions?: string[];

  /** Required files' fieldNames in form data */
  requiredFiles?: string[];

  /** Allowed files' fieldNames in form data */
  allowedFiles?: string[];

  // ===> Additional JSON request body validations:
  /* eslint-disable-next-line */
  jsonSchema?: any;

  // /** Forbidden fields in request body */
  // forbiddenFields?: string[];

  // /** Allowed fields in request body */
  // allowedFields?: string[];

  // /** Required fields in request body */
  // requiredFields?: string[];
}

// TODO. Consider adding validations for allowed / required files with underlying config.
export type FilesField = string | [fieldName: string, files?: number] | { fieldName: string, files?: number };
