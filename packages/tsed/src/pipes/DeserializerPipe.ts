/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeserializerPipe as BaseDeserializerPipe, IPipe, ParamMetadata } from '@tsed/common';
import { OverrideProvider } from '@tsed/di';
import { plainToClass } from 'class-transformer';

@OverrideProvider(BaseDeserializerPipe)
export class DeserializerPipe implements IPipe {
  public transform(value: any, metadata: ParamMetadata): any {
    return plainToClass(metadata.type, value);
  }
}
