/* eslint-disable import/no-extraneous-dependencies */
import { Part } from 'multiparty';
import { merge } from 'lodash';

import { getFileExtension, singleton, msg } from '@ts-utils/utils';

import {
  IRequestValidator, IRequestValidatorPolicy, IRequestValidatorFileMetadata,
  IRequestValidatorErrorMessages, IRequestValidatorErrorMessage,
} from '../types';

class RequestValidatorSingleton implements IRequestValidator {
  /** Error messages */
  private _errors: IRequestValidatorErrorMessages = {
    maxFiles: (amount?: number): string => `Max files exceeded.${amount
      ? ` Only ${amount} files allowed`
      : ''}`,

    fileSize: (size?: number): string => `File size exceeded.${size ? ` Max size is ${size / 1000}kb` : ''}`,
    fileExtension: (extensions?: string[]): string => `File extension is not allowed.${extensions
      ? ` Allowed extensions are: ${extensions}`
      : ''}`,

    allowedFilesFields: (filesFields?: string[]): string => `Only files with next fieldNames are allowed: ${filesFields}`,
    requiredFilesFields: (filesFields?: string[]): string => `Files with next fieldNames are required: ${filesFields}`,

    requiredFields: (fields?: string[]): string => `All fields required${fields ? `: ${fields}` : '.'}`,
    forbiddenFields: (fields?: string[]): string => `Some fields are forbidden${fields ? `: ${fields}` : '.'}`,

    default: 'There was a problem validating the file.',
  };

  /** Sets custom error messages */
  public setErrorMessages(cstomErrorMessages: IRequestValidatorErrorMessages): void {
    this._errors = merge(this._errors, cstomErrorMessages);
  }

  /** Getter for validation errors */
  public get errors(): IRequestValidatorErrorMessages {
    return this._errors;
  }

  /**
   *  Validates request. Could be used with parsed multipart stream / data either with json
   *
   *  Runs all validations excluding requiredFilesFields for multipart uploads
   *  (coz it is necessary to parse all files from stream before running this validation)
   *
   *  @param validationPolicy - Validation policy for this stream
   *  @param [fields] - Text fields
   *  @param [filesCount] - Files receiving from stream
   *  @param [file] - File to validate
   */
  public validate(
    validationPolicy: IRequestValidatorPolicy, fields?: GenericObject<string | number | boolean>,
    filesCount?: number, file?: Part,
  ): IMsg<string> {
    // Allowed files amount
    if (validationPolicy && validationPolicy.maxFiles && filesCount && filesCount > validationPolicy.maxFiles) {
      return msg.badRequest(this.provideError(this._errors.maxFiles, validationPolicy.maxFiles));
    }

    // Required fields & required fields (in formData) for files upload
    if (validationPolicy && validationPolicy.requiredFields && fields) {
      const required = (
        !file && validationPolicy.requiredFilesFields && validationPolicy.requiredFilesFields.length
      )
        ? [...validationPolicy.requiredFields, ...validationPolicy.requiredFilesFields]
        : validationPolicy.requiredFields;

      const passed = this.validateRequiredFields(fields, required);

      if (!passed) return msg.badRequest(this.provideError(this._errors.requiredFields, required));
    }

    // Forbidden fields. Forbidden fileds just woulds be deleted from body
    if (validationPolicy && validationPolicy.forbiddenFields && fields) {
      const passed = this.validateForbiddenFields(fields, validationPolicy.forbiddenFields);

      if (!passed) return msg.badRequest(this.provideError(this._errors.forbiddenFields, validationPolicy.forbiddenFields));
    }

    // File max size
    if (validationPolicy && validationPolicy.maxSize && file) {
      const passed = this.validateFileSize(file, validationPolicy.maxSize);

      if (!passed) return msg.badRequest(this.provideError(this._errors.fileSize, validationPolicy.maxSize));
    }

    // Allowed file extensions
    if (validationPolicy && validationPolicy.allowedExtensions && file) {
      const passed = this.validateFileExtension(file, validationPolicy.allowedExtensions);

      if (!passed) return msg.badRequest(this.provideError(this._errors.fileExtension, validationPolicy.allowedExtensions));
    }

    // Allowed fields (in formData) for files upload
    if (validationPolicy && validationPolicy.allowedFilesFields && file) {
      const passed = this.validateFileField(file, validationPolicy.allowedFilesFields);

      if (!passed) {
        return msg.badRequest(this.provideError(this._errors.allowedFilesFields, validationPolicy.allowedFilesFields));
      }
    }

    return msg.ok();
  }

  /**
   *  Validates file's maxSize
   *
   *  @param file - File to validate
   *  @param maxSize - File's max size to validate against
   */
  public validateFileSize(file: Part, maxSize: number): boolean {
    if (!maxSize) return true;
    if (file.byteCount > maxSize) return false;
    return true;
  }

  /**
   *  Validates file's extension
   *
   *  @param file - File to validate
   *  @param allowedExtensions - File's max size to validate against
   */
  public validateFileExtension(file: Part, allowedExtensions: string[]): boolean {
    if (!allowedExtensions || !allowedExtensions.length) return true;

    const extension = getFileExtension(file.filename);
    if (extension && !allowedExtensions.find((item) => item.toLowerCase() === extension.toLowerCase())) return false;
    // if (extension && allowedExtensions.indexOf(extension.toUpperCase()) === -1) return false;

    return true;
  }

  /**
   *  Validates request's fields to found those which are forbidden and deletes them
   *
   *  @param fields - All fields to validate throught
   *  @param forbiddenFields - File's max size to validate against
   */
  public validateForbiddenFields(
    fields: { [x: string]: string | number | boolean }, forbiddenFields: string[],
  ): boolean {
    if (!forbiddenFields || !forbiddenFields.length) return true;

    const noForbiddenFieldsFound = true;
    forbiddenFields.forEach((item) => {
      if (!noForbiddenFieldsFound) return;
      // if (Object.prototype.hasOwnProperty.call(fields, item)) noForbiddenFieldsFound = false;
      /* eslint-disable-next-line */
      if (Object.prototype.hasOwnProperty.call(fields, item)) delete fields[item];
    });

    return noForbiddenFieldsFound;
  }

  /**
   *  Validates request's fields
   *
   *  @param fields - All fields to validate throught
   *  @param requiredFields - File's max size to validate against
   */
  public validateRequiredFields(
    fields: { [x: string]: string | number | boolean }, requiredFields: string[],
  ): boolean {
    if (!requiredFields || !requiredFields.length) return true;

    let allFieldsFound = true;
    requiredFields.forEach((item) => {
      if (!allFieldsFound) return;
      if (!Object.prototype.hasOwnProperty.call(fields, item)) allFieldsFound = false;
      if (!fields[item] && fields[item] !== false) allFieldsFound = false;
    });

    return allFieldsFound;
  }

  /**
   *  Validates file's field name in request stream to be in allowed list
   *
   *  @param file - File to validate
   *  @param allowedFilesFields - File's field names to validate against
   */
  public validateFileField(file: Part, allowedFilesFields: string[]): boolean {
    if (!allowedFilesFields || !allowedFilesFields.length) return true;
    return !!(allowedFilesFields.find((item) => item === file.name));
  }

  /**
   *  Validates required files fields name
   *
   *  @param file - File to validate
   *  @param requiredFilesFields - List of required files fieldNames for request
   */
  public validateRequiredFilesFields<I extends IRequestValidatorFileMetadata = IRequestValidatorFileMetadata>(
    files: I[], requiredFilesFields: string[],
  ): boolean {
    if (!requiredFilesFields || !requiredFilesFields.length) return true;

    let allFound = true;
    requiredFilesFields.forEach((item) => {
      if (!allFound) return;
      allFound = !!(files.find((unit) => unit.fieldName === item));
    });

    return allFound;
  }

  /**
   *  Conditionaly appplies validator message. If func -> calls it, else return string
   *
   *  @param error - Error function or message
   *  @param arg - Argument for error function
   */
  public provideError<A>(error: IRequestValidatorErrorMessage<A>, arg: A): string {
    if (typeof error === 'function') return error(arg);
    return error;
  }
}

/** Manages upload requests validations */
export const RequestValidator = singleton(RequestValidatorSingleton);
