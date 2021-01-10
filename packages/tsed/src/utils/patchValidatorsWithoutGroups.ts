import { getMetadataStorage } from 'class-validator';
import { ValidationMetadata } from 'class-validator/types/metadata/ValidationMetadata';

export function patchValidatorsWithoutGroups(): void {
  const validationMetadatasKey = 'validationMetadatas';
  const validationMetadatas: ValidationMetadata[] = getMetadataStorage()[validationMetadatasKey];

  const forUpdate = validationMetadatas.filter((item) => !item.groups?.length);
  forUpdate.forEach((_item, i) => { forUpdate[i].always = true; });

  // const forUpdate = validationMetadatas.filter((item) => !item.groups?.includes('update'));
  // TODO. Leave this for now. Waiting for fixes/answers to github issues.
  // const forUpdate = validationMetadatas.filter((item) => item.groups?.includes('update'));

  // forUpdate.forEach((item) => {
  //   const list = validationMetadatas.filter((unit) => (
  //     unit.target === item.target
  //     && unit.type !== ValidationTypes.CONDITIONAL_VALIDATION
  //     && unit.propertyName === item.propertyName
  //   ));
  //   list.forEach((_unit, i) => { list[i].always = true; });
  // });
}
