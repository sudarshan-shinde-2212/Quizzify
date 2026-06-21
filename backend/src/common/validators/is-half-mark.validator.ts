import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';

@ValidatorConstraint({ name: 'isHalfMark', async: false })
class IsHalfMarkConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (typeof value !== 'number') return false;
    if (value <= 0) return false;
    // increments of 0.5: value * 2 should be integer
    if (Math.round(value * 2) !== value * 2) return false;
    // max allowed 4.0
    if (value > 4) return false;
    return true;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Marks must be in increments of 0.5.';
  }
}

export function IsHalfMark(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsHalfMarkConstraint,
    });
  };
}
