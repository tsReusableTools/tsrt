// /* eslint-disable import/no-extraneous-dependencies */
// import { Part } from 'multiparty';
//
// /** Interface for Request Validator. Can validate requests w/ JSON body, formData, stream data */
// export interface IRequestValidator {
//   /**
//    *  Validates upload stream
//    *
//    *  @param validationPolicy - Validation policy for this request
//    *  @param [fields] - Upload stream fields
//    *  @param [files] - Files receiving from stream
//    *  @param [file] - File to validate
//    */
//   validate(
//     validationPolicy: IRequestValidatorPolicy, fields?: GenericObject<string | number | boolean>,
//     filesCount?: number, file?: Part,
//   ): IMsg<string>;
//
//   /**
//    *  Validates file's maxSize
//    *
//    *  @param file - File to validate
//    *  @param maxSize - File's max size to validate against
//    */
//   validateFileSize(file: Part, maxSize: number): boolean;
//
//   /**
//    *  Validates file's extension
//    *
//    *  @param file - File to validate
//    *  @param allowedExtensions - File's max size to validate against
//    */
//   validateFileExtension(file: Part, allowedExtensions: string[]): boolean;
//
//   /**
//    *  Validates request's fields
//    *
//    *  @param fields - All fields to validate through
//    *  @param requiredFields - File's max size to validate against
//    */
//   validateRequiredFields(
//     fields: { [x: string]: string | number | boolean }, requiredFields: string[],
//   ): boolean;
//
//   /**
//    *  Validates file's field name in request stream to be in allowed list
//    *
//    *  @param file - File to validate
//    *  @param allowedFilesFields - File's field names to validate against
//    */
//   validateFileField(file: Part, allowedFilesFields: string[]): boolean;
//
//   /**
//    *  Validates required files fields name
//    *
//    *  @param file - File to validate
//    *  @param requiredFilesFields - List of required files fieldNames for request
//    */
//   validateRequiredFilesFields<
//     I extends IRequestValidatorFileMetadata = IRequestValidatorFileMetadata>(
//     files: I[], requiredFilesFields: string[],
//   ): boolean;
// }
//
// /** Interfaces for uploads validation policy */
// export interface IRequestValidatorPolicy {
//   // Aliases for create / update operations
//   CREATE?: IRequestValidatorPolicy;
//   UPDATE?: IRequestValidatorPolicy;
//
//   // ===> Form data request validations:
//
//   /** Allowed max file size  */
//   maxSize?: number;
//
//   /** Allowed max amount of files */
//   maxFiles?: number;
//
//   /** Allowed files' extensions */
//   allowedExtensions?: string[];
//
//   /** Required files' fieldNames in form data */
//   requiredFilesFields?: string[];
//
//   /** Allowed files' fieldNames in form data */
//   allowedFilesFields?: string[];
//
//   // ===> JSON request body validations:
//
//   /** Forbidden fields in request body */
//   forbiddenFields?: string[];
//
//   /** Allowed fields in request body */
//   allowedFields?: string[];
//
//   /** Required fields in request body */
//   requiredFields?: string[];
// }
//
// /** Interface for validation uploaded file metadata */
// export interface IRequestValidatorFileMetadata {
//   fieldName: string;
//   fileName: string;
//   contentType: string;
//   mediaType: string;
//   extension: string;
// }
//
// /** Interface for validation error messages */
// export interface IRequestValidatorErrorMessages {
//   maxFiles: IRequestValidatorErrorMessage<number>;
//
//   fileSize: IRequestValidatorErrorMessage<number>;
//   fileExtension: IRequestValidatorErrorMessage<string[]>;
//
//   allowedFilesFields: IRequestValidatorErrorMessage<string[]>;
//   requiredFilesFields: IRequestValidatorErrorMessage<string[]>;
//
//   requiredFields: IRequestValidatorErrorMessage<string[]>;
//   forbiddenFields: IRequestValidatorErrorMessage<string[]>;
//
//   default: string;
// }
//
// /** Interface for custom error message */
// export type IRequestValidatorErrorMessage<T = string> = ((arg?: T) => string) | string;
