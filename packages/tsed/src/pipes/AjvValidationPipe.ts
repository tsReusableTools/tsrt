// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { ValidationPipe, IPipe, ParamMetadata } from '@tsed/common';
// import { OverrideProvider } from '@tsed/di';
// import { getJsonSchema } from '@tsed/schema';
// import Ajv, { ErrorObject } from 'ajv';

// import { throwHttpError } from '@tsrt/utils';

// @OverrideProvider(ValidationPipe)
// export class AjvValidationPipe implements IPipe {
//   ajv = new Ajv({
//     allErrors: true,
//     coerceTypes: true,
//     verbose: true,
//     allowMatchingProperties: true,
//     $data: true,
//   });

//   transform(value: any, metadata: ParamMetadata): any {
//     const schema = getJsonSchema(metadata.type);
//     this.ajv.validate(schema, value);
//     const errors = this.ajv.errors.map(this.mapError);
//     if (this.ajv.errors) throwHttpError.badRequest(errors);
//     return value;
//   }

//   private mapError({ data: value, dataPath, message, parentSchema }: ErrorObject): any {
//     const constraints: GenericObject = { };
//     Object.entries(parentSchema).forEach(([key, val]) => { constraints[key] = `${key} should be ${val}`; });
//     const property = dataPath.replace('/', '');
//     return { property, value, message, constraints };
//   }
// }
