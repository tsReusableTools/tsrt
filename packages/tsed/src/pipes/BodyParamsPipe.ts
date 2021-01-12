/* eslint-disable max-len */
// /* eslint-disable max-len */
// /* eslint-disable no-param-reassign */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { Injectable, IPipe, ParamMetadata, UsePipe, IParamOptions, ParamTypes, UseParam } from '@tsed/common';
// import { useDecorators, Type, isObject, isPrimitive } from '@tsed/core';

// @Injectable()
// export class BodyParamsPipe implements IPipe<string, number> {
//   transform(value: any, metadata: ParamMetadata): any {
//     const options = { ...metadata.store.get<IBodyCustomOptions>(BodyParamsPipe) ?? { } };
//     ['required', 'expression', 'useType', 'useConverter', 'useValidation', 'paramType'].forEach((item) => { delete options[item]; });
//     Object.entries(options).forEach(([key, val]) => { (metadata as any)[key] = val; });
//     return value;
//   }
// }

// /**
//  *  Original function copied for TsED.
//  *  @see https://github.com/TypedProject/tsed/blob/664970d21f127932bffabcacba38ba7a8bd7b376/packages/common/src/mvc/utils/mapParamsOptions.ts
//  */
// export function mapParamsOptions(args: any[]): IParamOptions<any> {
//   if (args.length === 1) {
//     if (isPrimitive(args[0])) return { expression: args[0] };
//     if (!isObject(args[0])) return { useType: args[0] };
//     return args[0];
//   }
//   return { expression: args[0], useType: args[1] };
// }

// /**
//  *  Change for TsED BodyParams decorator, which provides additional options allowed to path into decorator.
//  */
// export function Body(): ParameterDecorator;
// export function Body(expression: string): ParameterDecorator;
// export function Body(useType: Type<any>): ParameterDecorator;
// export function Body(options: IParamOptions<any>): ParameterDecorator;
// export function Body(expression?: string | Type<any> | IParamOptions<any>, useType?: Type<any>): ParameterDecorator;
// export function Body(...args: any[]): ParameterDecorator {
//   const { expression, useType, useConverter = true, useValidation = true } = mapParamsOptions(args);
//   const options = typeof args[0] === 'object' ? args[0] : { };

//   return useDecorators(
//     UsePipe(BodyParamsPipe, options),
//     UseParam(ParamTypes.BODY, { expression, useConverter, useType, useValidation }),
//   );
// }

// export interface IBodyCustomOptions extends GenericObject {
//   validationGroups?: string[];
// }

// declare module '@tsed/common' {
//   export interface IParamOptions<T> extends IBodyCustomOptions {
//     required?: boolean;
//     expression?: string;
//     useType?: Type<T>;
//     useConverter?: boolean;
//     useValidation?: boolean;
//     paramType?: ParamTypes | string;
//   }

//   /* eslint-disable-next-line */
//   export interface ParamMetadata extends IBodyCustomOptions { }
// }

// export function patchBodyParamsDecorator(): void {
//   /* eslint-disable  */
//   // @ts-ignore
//   require('@tsed/common').BodyParams = Body;
// }
