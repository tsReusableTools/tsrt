import { IMpartyLimits, IFileMetadata, IMartyFileForValidation, IMartyFieldForValidation } from '../interfaces';
import { MpartyError, ErrorCodes } from '../utils';

class MpartyValidatorBase {
  public validateFile({ fieldName, extension }: IMartyFileForValidation, limits: IMpartyLimits = { }): boolean {
    const { extensions, allowedFiles, fieldNameSize } = limits;

    if (fieldNameSize || fieldNameSize === 0) {
      const isValid = this.valiadateFieldNameSize(fieldName, fieldNameSize);
      if (!isValid) this.throwValidationError('FIELD_NAME_SIZE_ERROR', limits, fieldName);
    }

    if (extensions?.length) {
      const isValid = this.validateExtension(extension, extensions);
      if (!isValid) this.throwValidationError('EXTENSIONS_ERROR', limits, fieldName);
    }

    if (allowedFiles?.length) {
      const isValid = this.validateAllowedFilesFields(fieldName, allowedFiles);
      if (!isValid) this.throwValidationError('ALLOWED_FIELDS_ERROR', limits, fieldName);
    }

    return true;
  }

  public validateField(
    { fieldName, fieldNameTruncated, valueTruncated }: IMartyFieldForValidation,
    limits: IMpartyLimits = { },
  ): boolean {
    const { fieldNameSize } = limits;
    if (fieldNameTruncated) this.throwValidationError('FIELD_NAME_SIZE_ERROR', limits, fieldName);
    if (valueTruncated) this.throwValidationError('FIELD_SIZE_ERROR', limits, fieldName);

    if (fieldNameSize || fieldNameSize === 0) {
      const isValid = this.valiadateFieldNameSize(fieldName, fieldNameSize);
      if (!isValid) this.throwValidationError('FIELD_NAME_SIZE_ERROR', limits, fieldName);
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

  public validateAllowedFilesFields(fieldName: string, allowedFiles: string[]): boolean {
    if (!allowedFiles?.length) return true;
    return !!(allowedFiles.find((item) => item === fieldName));
  }

  public validateExtension(extension: string, extensions: string[]): boolean {
    if (!extensions?.length) return true;
    if (extension && !extensions.find((item) => item.toLowerCase() === extension.toLowerCase())) return false;
    return true;
  }

  private throwValidationError(code: ErrorCodes, limits?: IMpartyLimits, fieldName?: string): void {
    throw new MpartyError(code, null, limits, fieldName);
  }
}

export const MpartyValidator = new MpartyValidatorBase();
