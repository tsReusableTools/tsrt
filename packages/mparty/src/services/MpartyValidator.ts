import { IMpartyLimits, IAdapterFileMetadata } from '../interfaces';
import { getFileExtension, ERRORS, MpartyError } from '../utils';

export class MpartyValidator {
  public validateFile(
    { originalFileName, fieldName }: Partial<IAdapterFileMetadata>,
    { extensions, allowedFilesFields }: IMpartyLimits,
  ): boolean {
    if (extensions?.length) {
      const isValid = this.validateExtension(originalFileName, extensions);
      if (!isValid) throw new MpartyError(ERRORS.extensions(extensions), fieldName);
    }

    if (allowedFilesFields?.length) {
      const isValid = this.validateField(originalFileName, allowedFilesFields);
      if (!isValid) throw new MpartyError(ERRORS.allowedFilesFields(allowedFilesFields), fieldName);
    }

    return true;
  }

  public validateRequiredFilesFields(files: IAdapterFileMetadata[], requiredFilesFields: string[]): boolean {
    if (!requiredFilesFields?.length) return true;

    let allFound = true;
    requiredFilesFields.forEach((item) => {
      if (!allFound) return;
      allFound = !!(files.find((unit) => unit.fieldName === item));
    });

    return allFound;
  }

  public validateField(fileName: string, allowedFilesFields: string[]): boolean {
    if (!allowedFilesFields?.length) return true;
    return !!(allowedFilesFields.find((item) => item === fileName));
  }

  public validateExtension(fileName: string, extensions: string[]): boolean {
    if (!extensions?.length) return true;

    const extension = getFileExtension(fileName);
    if (extension && !extensions.find((item) => item.toLowerCase() === extension.toLowerCase())) return false;

    return true;
  }
}
