// THIS ONE CANNOT BE USED NORMALLY UNTIL FIX FOR BOOLEAN TRANSFORM IN 'class-transformer'
// @see https://github.com/typestack/class-transformer/issues/306

// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { DeserializerPipe as BaseDeserializerPipe, IPipe, ParamMetadata } from '@tsed/common';
// import { OverrideProvider, Configuration } from '@tsed/di';
// import { plainToClass } from 'class-transformer';

// import { IApplicationSettings } from '../interfaces';
// @OverrideProvider(BaseDeserializerPipe)
// export class DeserializerPipe implements IPipe {
//   @Configuration() private _settings: IApplicationSettings;

//   public transform(value: any, metadata: ParamMetadata): any {
//     return plainToClass(metadata.type, value, this._settings?.deserializerOptions);
//   }
// }
