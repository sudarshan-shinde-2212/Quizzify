import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsHalfIncrement(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isHalfIncrement',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'number') return false;
          // Must be positive and multiple of 0.5
          return value > 0 && Math.abs(value * 2 - Math.round(value * 2)) < 1e-8;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Marks must be in increments of 0.5.';
        },
      },
    });
  };
}
