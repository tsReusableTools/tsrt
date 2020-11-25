import { IMpartyLimits, IFileMetadata, IMartyFileForValidation, IMartyFieldForValidation } from '../interfaces';
import { getFileExtension, VALIDATION_ERRORS, ERRORS, MpartyError } from '../utils';

class MpartyValidatorBase {
  public validateFile(
    { originalFileName, fieldName }: IMartyFileForValidation,
    { extensions, allowedFiles, fieldNameSize }: IMpartyLimits = { },
  ): boolean {
    if (fieldNameSize || fieldNameSize === 0) {
      const isValid = this.valiadateFieldNameSize(fieldName, fieldNameSize);
      if (!isValid) this.throwValidationError(VALIDATION_ERRORS.fieldNameSize(fieldNameSize), fieldName);
    }

    if (extensions?.length) {
      const isValid = this.validateExtension(originalFileName, extensions);
      if (!isValid) this.throwValidationError(VALIDATION_ERRORS.extensions(extensions), fieldName);
    }

    if (allowedFiles?.length) {
      const isValid = this.validateAllowedFilesFields(originalFileName, allowedFiles);
      if (!isValid) this.throwValidationError(VALIDATION_ERRORS.allowedFiles(allowedFiles), fieldName);
    }

    return true;
  }

  public validateField(
    { fieldName, fieldNameTruncated, valueTruncated }: IMartyFieldForValidation,
    { fieldNameSize, fieldSize }: IMpartyLimits = { },
  ): boolean {
    if (fieldNameTruncated) this.throwValidationError(VALIDATION_ERRORS.fieldNameSize(fieldNameSize), fieldName);
    if (valueTruncated) this.throwValidationError(VALIDATION_ERRORS.fieldSize(fieldSize), fieldName);

    if (fieldNameSize || fieldNameSize === 0) {
      const isValid = this.valiadateFieldNameSize(fieldName, fieldNameSize);
      if (!isValid) this.throwValidationError(VALIDATION_ERRORS.fieldNameSize(fieldNameSize), fieldName);
    }

    return true;
  }

  public valiadateFieldNameSize(fieldName: string, fieldNameSize: number): boolean {
    return fieldName?.length <= fieldNameSize;
  }

  public validateRequiredFilesFields(files: IFileMetadata[], requiredFiles: string[]): boolean {
    if (!requiredFiles?.length) return true;

    let allFound = true;
    requiredFiles.forEach((item) => {
      if (!allFound) return;
      allFound = !!(files.find((unit) => unit.fieldName === item));
    });

    return allFound;
  }

  public validateAllowedFilesFields(fileName: string, allowedFiles: string[]): boolean {
    if (!allowedFiles?.length) return true;
    return !!(allowedFiles.find((item) => item === fileName));
  }

  public validateExtension(fileName: string, extensions: string[]): boolean {
    if (!extensions?.length) return true;

    const extension = getFileExtension(fileName);
    if (extension && !extensions.find((item) => item.toLowerCase() === extension.toLowerCase())) return false;

    return true;
  }

  private throwValidationError(message: string, fieldName?: string): void {
    throw new MpartyError(message, ERRORS.VALIDATION_ERROR, fieldName);
  }
}

export const MpartyValidator = new MpartyValidatorBase();
